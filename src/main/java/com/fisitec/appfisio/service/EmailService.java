package com.fisitec.appfisio.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

/**
 * Servicio encargado del envío asíncrono de correos electrónicos
 * transaccionales.
 * Diseña automáticamente la plantilla HTML de bienvenida con credenciales
 * iniciales.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

  private final JavaMailSender mailSender;

  @Value("${spring.mail.username:app.fisio420@gmail.com}")
  private String fromEmail;

  @Value("${spring.mail.password:}")
  private String mailPassword;

  @Value("${app.frontend.url:https://appfisio.online}")
  private String frontendUrl;

  /**
   * Envía en segundo plano (@Async) el correo de bienvenida con las credenciales
   * temporales al registrar un Paciente o un Fisioterapeuta/Staff.
   */
  @Async
  public void sendWelcomeCredentials(String toEmail, String displayName, String username, String temporaryPassword,
      String roleName) {
    if (mailPassword == null || mailPassword.isBlank()) {
      log.info("Modo sin MAIL_PASSWORD configurado: se omite envío real de correo a {} (usuario: {})", toEmail,
          username);
      return;
    }

    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(
          message,
          MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
          StandardCharsets.UTF_8.name());

      String friendlyRole = mapRoleLabel(roleName);
      String greetingName = (displayName != null && !displayName.isBlank()) ? displayName : username;

      helper.setFrom(fromEmail, "AppFisio");
      helper.setReplyTo(fromEmail);
      helper.setTo(toEmail);
      helper.setSubject("Bienvenido a AppFisio: Credenciales de acceso");

      // Cabeceras RFC antispam para correos transaccionales
      message.addHeader("X-Auto-Response-Suppress", "OOF, AutoReply");
      message.addHeader("Auto-Submitted", "auto-generated");

      String plainText = """
          ¡Hola, %s!

          Tu cuenta en AppFisio (%s) ha sido creada con éxito.

          Tus credenciales de acceso:
          - Usuario: %s
          - Correo: %s
          - Contraseña temporal: %s

          Importante: Al iniciar sesión por primera vez, el sistema te solicitará cambiar esta contraseña por una definitiva.

          Ingresa al portal aquí: %s

          © AppFisio — Portal Clínico
          """
          .formatted(greetingName, friendlyRole, username, toEmail, temporaryPassword, frontendUrl);

      String htmlText = buildWelcomeHtml(greetingName, username, toEmail, temporaryPassword, friendlyRole);

      // helper.setText(plainText, htmlText) crea un correo Multipart Alternative
      // estándar
      helper.setText(plainText, htmlText);

      mailSender.send(message);
      log.info("Correo de bienvenida enviado exitosamente a {} ({})", toEmail, friendlyRole);
    } catch (Exception e) {
      // Capturamos cualquier fallo de red o SMTP para que NUNCA revierta ni rompa el
      // alta en base de datos
      log.error("No se pudo enviar el correo de bienvenida a {}: {}", toEmail, e.getMessage());
    }
  }

  private String mapRoleLabel(String roleName) {
    if (roleName == null)
      return "Usuario";
    return switch (roleName) {
      case "ROLE_FISIOTERAPEUTA" -> "Fisioterapeuta";
      case "ROLE_ADMIN" -> "Administrador";
      case "ROLE_RECEPCION" -> "Recepción";
      default -> "Paciente";
    };
  }

  private String buildWelcomeHtml(String greetingName, String username, String email, String temporaryPassword,
      String friendlyRole) {
    return """
        <!DOCTYPE html>
        <html lang="es">
        <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
          <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:24px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
            <div style="background:#0d9488;padding:28px 32px;text-align:center;color:#ffffff;">
              <h1 style="margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">AppFisio</h1>
              <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Portal de Fisioterapia &amp; Rehabilitación Clínica</p>
            </div>
            <div style="padding:32px;">
              <span style="display:inline-block;background:#f0fdfa;color:#0f766e;border:1px solid #99f6e4;font-size:11px;font-weight:700;text-transform:uppercase;padding:4px 12px;border-radius:999px;margin-bottom:16px;">
                Cuenta de %s
              </span>
              <h2 style="margin:0 0 12px;font-size:20px;color:#0f172a;">¡Hola, %s!</h2>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">
                Tu cuenta en <strong>AppFisio</strong> ha sido creada exitosamente. A continuación encontrarás tus credenciales iniciales para ingresar al portal:
              </p>
              <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:16px;padding:20px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:13px;color:#334155;"><strong>Usuario:</strong> <code style="color:#0f172a;font-size:14px;">%s</code></p>
                <p style="margin:0 0 8px;font-size:13px;color:#334155;"><strong>Correo registrado:</strong> <span style="color:#0f172a;">%s</span></p>
                <p style="margin:0;font-size:13px;color:#334155;"><strong>Contraseña temporal:</strong> <code style="background:#ccfbf1;color:#115e59;padding:3px 8px;border-radius:6px;font-weight:700;font-size:14px;">%s</code></p>
              </div>
              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px 16px;margin-bottom:24px;font-size:12px;color:#92400e;line-height:1.5;">
                <strong>Importante por tu seguridad:</strong> Al iniciar sesión por primera vez con esta contraseña temporal, el sistema te solicitará elegir una contraseña personal definitiva.
              </div>
              <div style="text-align:center;margin:28px 0 12px;">
                <a href="%s" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:14px;">
                  Ingresar a AppFisio
                </a>
              </div>
            </div>
            <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;font-size:11px;color:#64748b;">
              © AppFisio — Información confidencial y protegida.
            </div>
          </div>
        </body>
        </html>
        """
        .formatted(friendlyRole, greetingName, username, email, temporaryPassword, frontendUrl);
  }
}
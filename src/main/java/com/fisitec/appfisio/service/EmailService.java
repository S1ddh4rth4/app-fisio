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

  @Value("${app.frontend.url:https://appfisio.com}")
  private String frontendUrl;

  private String getFrontendUrl() {
    if (frontendUrl == null || frontendUrl.isBlank()) {
      return "https://appfisio.com";
    }
    return frontendUrl.replace("appfisio.online", "appfisio.com");
  }

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
          .formatted(greetingName, friendlyRole, username, toEmail, temporaryPassword, getFrontendUrl());

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

  private String escapeHtml(String input) {
    return input == null ? "" : org.springframework.web.util.HtmlUtils.htmlEscape(input);
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
        .formatted(escapeHtml(friendlyRole), escapeHtml(greetingName), escapeHtml(username), escapeHtml(email),
            escapeHtml(temporaryPassword), getFrontendUrl());
  }

  /**
   * Envía confirmación de cita agendada tanto al paciente (con aviso de
   * vestimenta)
   * como al fisioterapeuta tratante.
   */
  @Async
  public void sendAppointmentConfirmation(com.fisitec.appfisio.entity.Appointment appt) {
    if (mailPassword == null || mailPassword.isBlank()) {
      log.info("Modo sin MAIL_PASSWORD: se omite confirmación de cita #{}", appt.getId());
      return;
    }

    try {
      var patient = appt.getPatient();
      var physio = appt.getProfessional();
      String patientEmail = patient.getEmail();
      String physioEmail = physio.getEmail();

      var formatter = java.time.format.DateTimeFormatter
          .ofPattern("EEEE d 'de' MMMM 'de' yyyy 'a las' HH:mm 'hrs'", new java.util.Locale("es", "MX"));
      String formattedDate = appt.getAppointmentDate().format(formatter);
      String patientName = (patient.getFullName() != null && !patient.getFullName().isBlank())
          ? patient.getFullName()
          : patient.getUsername();
      String physioName = (physio.getFullName() != null && !physio.getFullName().isBlank())
          ? physio.getFullName()
          : physio.getUsername();

      // 1. Correo al Paciente con recomendaciones de vestimenta (Punto 12)
      if (patientEmail != null && !patientEmail.isBlank()) {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
            StandardCharsets.UTF_8.name());
        helper.setFrom(fromEmail, "AppFisio Citas");
        helper.setReplyTo(fromEmail);
        helper.setTo(patientEmail);
        helper.setSubject("Cita Confirmada en AppFisio — " + formattedDate);

        String htmlPatient = """
            <!DOCTYPE html>
            <html lang="es">
            <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
              <div style="max-width:560px;margin:30px auto;background:#ffffff;border-radius:24px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
                <div style="background:#0d9488;padding:26px 30px;text-align:center;color:#ffffff;">
                  <h1 style="margin:0;font-size:24px;font-weight:800;">AppFisio</h1>
                  <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">Confirmación de Cita Fisioterapéutica</p>
                </div>
                <div style="padding:30px;">
                  <h2 style="margin:0 0 10px;font-size:18px;">¡Hola, %s!</h2>
                  <p style="font-size:14px;color:#475569;margin-bottom:20px;">Tu cita clínica ha sido agendada con éxito. A continuación los detalles:</p>

                  <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:16px;padding:18px;margin-bottom:20px;font-size:13px;">
                    <p style="margin:0 0 8px;"><strong>Fecha y Hora:</strong> <span style="color:#0f766e;font-weight:700;">%s</span></p>
                    <p style="margin:0 0 8px;"><strong>Fisioterapeuta:</strong> %s</p>
                    <p style="margin:0;"><strong>Tipo de Consulta:</strong> %s</p>
                  </div>

                  <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:16px;padding:18px;margin-bottom:22px;font-size:12px;color:#92400e;line-height:1.6;">
                    <strong style="font-size:13px;display:block;margin-bottom:6px;">⚠️ Recomendación Importante de Vestimenta:</strong>
                    Para poder realizar tu valoración funcional y aplicar las técnicas fisioterapéuticas con total comodidad, te solicitamos acudir con <strong>ropa cómoda u holgada</strong>:
                    <ul style="margin:8px 0 0;padding-left:20px;">
                      <li><strong>Zona inferior y columna:</strong> Short deportivo (indispensable acudir en short).</li>
                      <li><strong>Zona superior y cuello:</strong> Top deportivo, blusa o playera de tirantes / manga corta.</li>
                      <li>Calzado cómodo o tenis.</li>
                    </ul>
                  </div>

                  <div style="text-align:center;margin:24px 0 10px;">
                    <a href="%s" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:12px 24px;border-radius:12px;">
                      Ver mi Cita en AppFisio
                    </a>
                  </div>
                </div>
                <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px;text-align:center;font-size:11px;color:#64748b;">
                  Si requieres reagendar, ingresa al portal o comunícate a la clínica con al menos 12h de anticipación.
                </div>
              </div>
            </body>
            </html>
            """
            .formatted(escapeHtml(patientName), escapeHtml(formattedDate), escapeHtml(physioName),
                escapeHtml(appt.getAppointmentType()), getFrontendUrl());

        String plainTextPatient = "¡Hola, " + patientName + "!\n\nTu cita en AppFisio está confirmada para el "
            + formattedDate + " con " + physioName
            + ".\n\nRecomendación importante: Asistir con ropa cómoda u holgada (indispensable acudir en short deportivo, y blusa o playera de tirantes).\n\nIngresa a: "
            + getFrontendUrl();
        msg.addHeader("X-Auto-Response-Suppress", "OOF, AutoReply");
        msg.addHeader("Auto-Submitted", "auto-generated");
        helper.setText(plainTextPatient, htmlPatient);
        mailSender.send(msg);
        log.info("Confirmación de cita enviada a paciente {}", patientEmail);
      }

      // 2. Correo al Fisioterapeuta
      if (physioEmail != null && !physioEmail.isBlank()) {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
            StandardCharsets.UTF_8.name());
        helper.setFrom(fromEmail, "AppFisio Agenda");
        helper.setReplyTo(fromEmail);
        helper.setTo(physioEmail);
        helper.setSubject("Nueva Cita en tu Agenda: " + patientName);

        String htmlPhysio = """
            <!DOCTYPE html>
            <html lang="es">
            <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
              <div style="max-width:540px;margin:30px auto;background:#ffffff;border-radius:24px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
                <div style="background:#0f172a;padding:22px 28px;text-align:center;color:#ffffff;">
                  <h1 style="margin:0;font-size:20px;font-weight:800;">AppFisio — Agenda Clínica</h1>
                </div>
                <div style="padding:28px;font-size:13px;color:#334155;">
                  <h2 style="margin:0 0 10px;font-size:16px;color:#0f172a;">Hola, %s</h2>
                  <p>Se ha reservado una nueva cita en tu agenda:</p>
                  <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:14px;padding:16px;margin:16px 0;">
                    <p style="margin:0 0 6px;"><strong>Paciente:</strong> %s</p>
                    <p style="margin:0 0 6px;"><strong>Fecha y Hora:</strong> %s</p>
                    <p style="margin:0 0 6px;"><strong>Tipo de Cita:</strong> %s</p>
                    <p style="margin:0;"><strong>Motivo:</strong> %s</p>
                  </div>
                  <div style="text-align:center;margin-top:20px;">
                    <a href="%s" style="background:#0d9488;color:#ffffff;text-decoration:none;font-weight:700;font-size:12px;padding:10px 20px;border-radius:10px;">
                      Abrir Agenda en AppFisio
                    </a>
                  </div>
                </div>
              </div>
            </body>
            </html>
            """
            .formatted(escapeHtml(physioName), escapeHtml(patientName), escapeHtml(formattedDate),
                escapeHtml(appt.getAppointmentType()),
                escapeHtml(appt.getReason() != null ? appt.getReason() : "Consulta"), getFrontendUrl());

        helper.setText(htmlPhysio, true);
        mailSender.send(msg);
        log.info("Aviso de cita enviado a fisioterapeuta {}", physioEmail);
      }
    } catch (Exception e) {
      log.error("Fallo al enviar correos de confirmación de cita: {}", e.getMessage());
    }
  }

  /**
   * Envía al paciente el resumen clínico y comprobante de atención una vez
   * liquidada la consulta.
   */
  @Async
  public void sendSessionSummary(com.fisitec.appfisio.entity.Appointment appt) {
    if (mailPassword == null || mailPassword.isBlank()) {
      log.info("Modo sin MAIL_PASSWORD: se omite resumen de sesión #{}", appt.getId());
      return;
    }

    try {
      var patient = appt.getPatient();
      String patientEmail = patient.getEmail();
      if (patientEmail == null || patientEmail.isBlank())
        return;

      var physio = appt.getProfessional();
      var formatter = java.time.format.DateTimeFormatter
          .ofPattern("d 'de' MMMM 'de' yyyy", new java.util.Locale("es", "MX"));
      String formattedDate = appt.getAppointmentDate().format(formatter);
      String patientName = (patient.getFullName() != null && !patient.getFullName().isBlank())
          ? patient.getFullName()
          : patient.getUsername();
      String physioName = (physio.getFullName() != null && !physio.getFullName().isBlank())
          ? physio.getFullName()
          : physio.getUsername();

      String treatmentName = appt.getTreatment() != null
          ? appt.getTreatment().getName()
          : (appt.getPatientPackage() != null
              ? "Paquete: " + appt.getPatientPackage().getPackageName()
              : "Atención Fisioterapéutica");
      String duration = appt.getTreatment() != null ? appt.getTreatment().getDurationMinutes() + " minutos"
          : "60 minutos";
      String amountPaid = appt.getPatientPackage() != null
          ? "$0.00 MXN (1 sesión descontada de paquete)"
          : (appt.getPaymentAmount() != null ? "$" + appt.getPaymentAmount() + " MXN" : "Liquidado");
      String paymentMethod = appt.getPaymentMethod() != null ? appt.getPaymentMethod() : "Liquidado en caja";
      String notes = (appt.getClinicalNotes() != null && !appt.getClinicalNotes().isBlank())
          ? appt.getClinicalNotes()
          : "Sesión realizada según el plan terapéutico establecido.";

      MimeMessage msg = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(msg, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
          StandardCharsets.UTF_8.name());
      helper.setFrom(fromEmail, "AppFisio Atención Médica");
      helper.setReplyTo(fromEmail);
      helper.setTo(patientEmail);
      helper.setSubject("Resumen de tu Sesión de Terapia — AppFisio");

      String plainTextSummary = "¡Hola, " + patientName + "!\n\nResumen de tu sesión de hoy (" + formattedDate
          + "):\nTratamiento: " + treatmentName + " (" + duration + ")\nTotal pagado: " + amountPaid + " ("
          + paymentMethod + ")\nNotas de la sesión: " + notes + "\n\nConsulta tus ejercicios en: " + getFrontendUrl()
          + "/prescriptions";
      msg.addHeader("X-Auto-Response-Suppress", "OOF, AutoReply");
      msg.addHeader("Auto-Submitted", "auto-generated");
      String html = """
          <!DOCTYPE html>
          <html lang="es">
          <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
            <div style="max-width:560px;margin:30px auto;background:#ffffff;border-radius:24px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
              <div style="background:#0d9488;padding:26px 30px;text-align:center;color:#ffffff;">
                <h1 style="margin:0;font-size:24px;font-weight:800;">AppFisio</h1>
                <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">Comprobante de Atención &amp; Resumen Clínico</p>
              </div>
              <div style="padding:30px;">
                <h2 style="margin:0 0 10px;font-size:18px;">¡Hola, %s!</h2>
                <p style="font-size:14px;color:#475569;margin-bottom:20px;">Te compartimos el resumen de la sesión fisioterapéutica realizada el día de hoy (%s):</p>

                <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:16px;padding:18px;margin-bottom:18px;font-size:13px;">
                  <p style="margin:0 0 6px;"><strong>Tratamiento:</strong> %s (%s)</p>
                  <p style="margin:0 0 6px;"><strong>Fisioterapeuta:</strong> %s</p>
                  <p style="margin:0 0 6px;"><strong>Importe Liquidado:</strong> %s</p>
                  <p style="margin:0;"><strong>Método de Pago:</strong> %s</p>
                </div>

                <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:16px;padding:18px;margin-bottom:22px;">
                  <strong style="font-size:12px;color:#0f766e;text-transform:uppercase;display:block;margin-bottom:6px;">Detalles y Notas de la Sesión:</strong>
                  <div style="font-size:13px;color:#334155;line-height:1.6;white-space:pre-wrap;font-family:monospace;">%s</div>
                </div>

                <div style="text-align:center;margin:24px 0 10px;">
                  <a href="%s/prescriptions" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:12px 24px;border-radius:12px;">
                    Ver mis Ejercicios en Casa
                  </a>
                </div>
              </div>
              <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px;text-align:center;font-size:11px;color:#64748b;">
                Gracias por confiar tu salud y rehabilitación en AppFisio.
              </div>
            </div>
          </body>
          </html>
          """
          .formatted(escapeHtml(patientName), escapeHtml(formattedDate), escapeHtml(treatmentName),
              escapeHtml(duration), escapeHtml(physioName), escapeHtml(amountPaid), escapeHtml(paymentMethod),
              escapeHtml(notes), getFrontendUrl());

      helper.setText(plainTextSummary, html);
      mailSender.send(msg);
      log.info("Resumen de sesión enviado a paciente {}", patientEmail);
    } catch (Exception e) {
      log.error("Fallo al enviar resumen de sesión: {}", e.getMessage());
    }
  }
}
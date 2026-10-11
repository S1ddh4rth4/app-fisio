package com.fisitec.appfisio.service;

import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.util.Utils;
import org.springframework.stereotype.Service;

@Service
public class MfaService {

    // Genera una llave matemática única (Ej: JBSWY3DPEHPK3PXP)
    public String generateSecret() {
        return new DefaultSecretGenerator().generate();
    }

    // Genera la URI estándar TOTP compatible con Google Authenticator y Apple
    // Passwords
    public String getQrCodeUri(String secret, String username) {
        QrData data = new QrData.Builder()
                .label(username)
                .secret(secret)
                .issuer("AppFisio")
                .digits(6)
                .period(30)
                .build();
        return data.getUri();
    }

    // Genera la imagen PNG del código QR en formato Base64 lista para mostrar en
    // <img>
    public String getQrCodeImageBase64(String secret, String username) {
        try {
            QrData data = new QrData.Builder()
                    .label(username)
                    .secret(secret)
                    .issuer("AppFisio")
                    .digits(6)
                    .period(30)
                    .build();
            QrGenerator generator = new ZxingPngQrGenerator();
            byte[] imageData = generator.generate(data);
            return Utils.getDataUriForImage(imageData, generator.getImageMimeType());
        } catch (Exception e) {
            throw new RuntimeException("No se pudo generar la imagen del código QR para 2FA", e);
        }
    }

    // Valida matemáticamente si los 6 dígitos escritos coinciden con la hora actual
    public boolean verifyCode(String secret, String code) {
        CodeVerifier verifier = new DefaultCodeVerifier(new DefaultCodeGenerator(), new SystemTimeProvider());
        return verifier.isValidCode(secret, code);
    }
}
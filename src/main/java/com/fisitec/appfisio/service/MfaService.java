package com.fisitec.appfisio.service;

import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.springframework.stereotype.Service;

@Service
public class MfaService {

    // Genera una llave matemática única (Ej: JBSWY3DPEHPK3PXP)
    public String generateSecret() {
        return new DefaultSecretGenerator().generate();
    }

    // Genera la URI que el celular usará para conectarse a la cuenta
    public String getQrCodeUri(String secret, String username) {
        QrData data = new QrData.Builder()
                .label(username)
                .secret(secret)
                .issuer("FisioApp Corporativo")
                .digits(6)
                .period(30)
                .build();
        return data.getUri();
    }

    // Valida matemáticamente si los 6 dígitos escritos coinciden con la hora actual
    public boolean verifyCode(String secret, String code) {
        CodeVerifier verifier = new DefaultCodeVerifier(new DefaultCodeGenerator(), new SystemTimeProvider());
        // Valida el código permitiendo un pequeño margen de tiempo por si teclean lento
        return verifier.isValidCode(secret, code);
    }
}
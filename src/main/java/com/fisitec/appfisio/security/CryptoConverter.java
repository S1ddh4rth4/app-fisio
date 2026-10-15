package com.fisitec.appfisio.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

/**
 * Convertidor JPA para cifrado en reposo de datos clínicos sensibles (Fase 2
 * Hardening).
 * Implementa AES-256-GCM con IV aleatorio y soporte de retrocompatibilidad
 * (v2:)
 * para no corromper registros históricos previamente cifrados con AES-ECB.
 */
@Component
@Converter
public class CryptoConverter implements AttributeConverter<String, String> {

    private static final String AES_ALGORITHM = "AES";
    private static final String GCM_CIPHER = "AES/GCM/NoPadding";
    private static final String LEGACY_CIPHER = "AES"; // Por defecto AES/ECB/PKCS5Padding
    private static final String V2_PREFIX = "v2:";
    private static final int GCM_IV_LENGTH_BYTES = 12; // 96 bits recomendado por NIST
    private static final int GCM_TAG_LENGTH_BITS = 128; // Autenticación de integridad

    private static final SecureRandom secureRandom = new SecureRandom();
    private static Key key;

    @Value("${app.security.encryption-secret}")
    public void setSecretKey(String secret) {
        key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), AES_ALGORITHM);
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            // 1. Generar un Vector de Inicialización (IV) único e impredecible
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            // 2. Inicializar Cipher en modo GCM autenticado
            Cipher cipher = Cipher.getInstance(GCM_CIPHER);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, key, parameterSpec);

            byte[] cipherText = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));

            // 3. Empaquetar IV + CipherText en un solo arreglo de bytes
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);

            // 4. Guardar con prefijo v2: para identificar que usa GCM
            return V2_PREFIX + Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            throw new RuntimeException("Error encriptando dato clínico con AES-GCM", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            // Caso A: Registro moderno con AES-GCM (prefijo v2:)
            if (dbData.startsWith(V2_PREFIX)) {
                String base64Payload = dbData.substring(V2_PREFIX.length());
                byte[] decodedPayload = Base64.getDecoder().decode(base64Payload);

                // Extraer el IV (primeros 12 bytes) y el texto cifrado restante
                byte[] iv = Arrays.copyOfRange(decodedPayload, 0, GCM_IV_LENGTH_BYTES);
                byte[] cipherText = Arrays.copyOfRange(decodedPayload, GCM_IV_LENGTH_BYTES, decodedPayload.length);

                Cipher cipher = Cipher.getInstance(GCM_CIPHER);
                GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
                cipher.init(Cipher.DECRYPT_MODE, key, parameterSpec);

                return new String(cipher.doFinal(cipherText), StandardCharsets.UTF_8);
            }

            // Caso B: Registro histórico (Legacy AES-ECB) para garantizar
            // retrocompatibilidad
            Cipher legacyCipher = Cipher.getInstance(LEGACY_CIPHER);
            legacyCipher.init(Cipher.DECRYPT_MODE, key);
            return new String(legacyCipher.doFinal(Base64.getDecoder().decode(dbData)), StandardCharsets.UTF_8);

        } catch (Exception e) {
            throw new RuntimeException("Error desencriptando dato clínico", e);
        }
    }
}
package com.fisitec.appfisio.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

/**
 * Contrato de entrada (DTO) para la solicitud de inicio de sesión.
 */
@Data
public class LoginRequest {

    /**
     * Username or email for login.
     */
    @NotBlank(message = "Username or email is required")
    private String loginIdentifier;

    /**
     * Password for authentication.
     */
    @NotBlank(message = "Password is required")
    private String password;

    // Código de 6 dígitos opcional (solo se usa si el 2FA está activado)
    private String mfaCode;
}
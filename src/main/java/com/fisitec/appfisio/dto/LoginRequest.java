package com.fisitec.appfisio.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO for user login request.
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
}
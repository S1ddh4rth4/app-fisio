package com.fisitec.appfisio.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Objeto de transferencia (DTO) que devuelve el token JWT y los datos de sesión
 * activa.
 */
@Data
@AllArgsConstructor
public class AuthResponse {

    /**
     * JWT token for authenticated user.
     */
    private String token;

    /**
     * Username of the authenticated user.
     */
    private String username;

    /**
     * Email of the authenticated user.
     */
    private String email;

    /**
     * Roles of the authenticated user.
     */
    private String roles;

    /**
     * Bandera para forzar cambio de contraseña en primer login.
     */
    private Boolean mustChangePassword;
}
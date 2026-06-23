package com.fisitec.appfisio.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * DTO for authentication response.
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
}
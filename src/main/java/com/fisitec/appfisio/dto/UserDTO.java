package com.fisitec.appfisio.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * DTO for user information.
 */
@Data
public class UserDTO {

    /**
     * User ID.
     */
    private String id;

    /**
     * Username.
     */
    private String username;

    /**
     * Email address.
     */
    private String email;

    /**
     * User roles.
     */
    private Set<String> roles;

    /**
     * Account enabled status.
     */
    private Boolean enabled;

    /**
     * Creation timestamp.
     */
    private LocalDateTime createdAt;

    /**
     * Last update timestamp.
     */
    private LocalDateTime updatedAt;
}
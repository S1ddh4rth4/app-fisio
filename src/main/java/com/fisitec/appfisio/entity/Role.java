package com.fisitec.appfisio.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Entity representing a user role in the system.
 * Roles define permissions for users (e.g., ROLE_ADMIN, ROLE_FISIOTERAPEUTA, ROLE_PACIENTE).
 */
@Entity
@Table(name = "roles")
@Data
public class Role {

    /**
     * Unique identifier for the role.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Name of the role, must be unique (e.g., ROLE_ADMIN).
     */
    @Column(unique = true, nullable = false)
    private String name;
}
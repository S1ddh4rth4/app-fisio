package com.fisitec.appfisio.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import lombok.Data;

import java.time.LocalDateTime;

import java.util.Set;

/**
 * Entity representing a user in the system.
 * Users can have multiple roles and are authenticated via username/email and
 * password.
 */
@Entity
@Table(name = "users")
@Data
public class User {

    /**
     * Unique identifier for the user.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /**
     * Unique username for login.
     */
    @Column(unique = true, nullable = false)
    private String username;

    /**
     * Unique email address for the user.
     */
    @Column(unique = true, nullable = false)
    private String email;

    /**
     * Encrypted password for authentication.
     */
    @Column(nullable = false)
    private String password;

    /**
     * Roles assigned to the user (many-to-many relationship).
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles;

    /**
     * Flag indicating if the user account is enabled.
     */
    @Column(nullable = false)
    private Boolean enabled = true;

    /**
     * Timestamp when the user was created.
     */
    @Column(nullable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the user was last updated.
     */
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Pre-persist hook to set timestamps.
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    /**
     * Pre-update hook to update timestamp.
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
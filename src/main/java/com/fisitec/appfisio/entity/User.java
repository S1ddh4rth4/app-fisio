package com.fisitec.appfisio.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Entidad principal que representa a cualquier usuario de la clínica:
 * Administrador, Fisioterapeuta, Paciente, Recepción o Secretaría.
 */
@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class) // Habilita la auditoría automática de fechas y creador
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    // --- Datos de Perfil Universal (Todos los roles) ---

    @Column(name = "full_name", length = 150)
    private String fullName;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "professional_license", length = 50)
    private String professionalLicense;

    @jakarta.persistence.Lob
    @Column(name = "avatar_url")
    private String avatarUrl;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles;

    @Column(nullable = false)
    private Boolean enabled = true;

    // --- Autenticación de Dos Factores (2FA) ---
    @Column(name = "mfa_secret")
    private String mfaSecret;

    @Column(name = "mfa_enabled", nullable = false)
    private Boolean mfaEnabled = false;

    @Column(name = "must_change_password", nullable = false)
    private Boolean mustChangePassword = false;

    // --- Cumplimiento Legal y Consentimiento de Privacidad ---
    @Column(name = "privacy_policy_accepted_at")
    private LocalDateTime privacyPolicyAcceptedAt;

    // --- Fisioterapeuta de cabecera asignado a este paciente ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_physio_id")
    private User primaryPhysio;

    // --- Auditoría Automática del Sistema ---
    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedBy
    @Column(name = "updated_by")
    private String updatedBy;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
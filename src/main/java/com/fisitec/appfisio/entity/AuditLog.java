package com.fisitec.appfisio.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // Quién realizó la acción (ej. fisio1)
    @Column(name = "actor_username", nullable = false)
    private String actorUsername;

    // Qué hizo (ej. READ_MEDICAL_RECORD, CREATE_MEDICAL_RECORD)
    @Column(nullable = false)
    private String action;

    // A qué paciente afectó
    @Column(name = "target_patient_id", nullable = false)
    private String targetPatientId;

    // Contexto adicional opcional
    @Column(length = 500)
    private String details;

    // Sello de tiempo inmutable
    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private LocalDateTime timestamp;
}
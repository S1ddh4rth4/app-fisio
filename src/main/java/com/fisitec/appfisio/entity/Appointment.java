package com.fisitec.appfisio.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Entity representing an appointment.
 */
@Entity
@Table(name = "appointments")
@EntityListeners(AuditingEntityListener.class) // Auditoría activada
@Data
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "professional_id", nullable = false)
    private User professional;

    @Column(nullable = false)
    private LocalDateTime appointmentDate;

    @Column(length = 255)
    private String reason;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private String paymentStatus = "PENDIENTE";

    @Column(precision = 38, scale = 2)
    private java.math.BigDecimal paymentAmount;

    @Column(length = 255)
    private String paymentMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_package_id")
    private PatientPackage patientPackage;

    // --- Punto 4: Tipo de cita (Valoración o Seguimiento) ---
    @Column(name = "appointment_type", nullable = false)
    private String appointmentType = "VALORACION_INICIAL";

    // --- Flujo Continuo (Expediente y Cobranza) ---
    @Column(length = 2000)
    private String clinicalNotes; // La nota de evolución post-terapia

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "treatment_id")
    private Treatment treatment; // El servicio médico que se le cobró en Caja

    // --- Punto 1: Auditoría Automática ---
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
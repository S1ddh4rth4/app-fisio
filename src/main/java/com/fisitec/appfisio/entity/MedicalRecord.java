package com.fisitec.appfisio.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

import com.fisitec.appfisio.security.CryptoConverter;

@Entity
@Table(name = "medical_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // Relación con el Paciente
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    // Relación con el Fisioterapeuta que escribe la nota
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "physiotherapist_id", nullable = false)
    private User physiotherapist;

    // Relación OPCIONAL con una Cita específica (por si fue una consulta de
    // urgencia sin cita)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Convert(converter = CryptoConverter.class)
    @Column(nullable = false, length = 1000)
    private String diagnosis; // Diagnóstico

    @Convert(converter = CryptoConverter.class)
    @Lob
    @Column
    private String notes; // Notas de evolución de la sesión

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

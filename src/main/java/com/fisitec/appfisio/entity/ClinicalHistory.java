package com.fisitec.appfisio.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "clinical_histories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicalHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // Paciente al que pertenece esta historia/evaluación
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    // Fisioterapeuta responsable que realizó la valoración
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "physiotherapist_id", nullable = false)
    private User physiotherapist;

    // Número de expediente médico visible (ej. EXP-001)
    @Column(nullable = false)
    private String recordNumber;

    // Tipo de evaluación: INICIAL, SEGUIMIENTO, ALTA
    @Column(nullable = false)
    private String evaluationType;

    // Diagnóstico médico o fisioterapéutico principal
    @Column(length = 500)
    private String mainDiagnosis;

    // Escala del dolor (0 a 10) para filtros rápidos y gráficas
    private Integer painLevel;

    // Estructura completa de las 7 páginas clínicas guardada en JSON
    @Lob
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.CLOB)
    @Column(name = "form_data_json", nullable = false)
    private String formDataJson;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
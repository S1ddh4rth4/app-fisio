package com.fisitec.appfisio.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "exercise_prescriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExercisePrescription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "physiotherapist_id", nullable = false)
    private User physiotherapist;

    @Column(nullable = false)
    private String title; // Ej: "Plan Lumbar Fase 1", "Rehabilitación Manguito Rotador"

    @Lob
    @Column
    private String generalInstructions; // Recomendaciones generales o precauciones

    @Column(nullable = false)
    private LocalDate startDate;

    private LocalDate endDate;

    @Column(nullable = false)
    private String status; // ACTIVA, COMPLETADA, PAUSADA, CANCELADA

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "prescription_items", joinColumns = @JoinColumn(name = "prescription_id"))
    @Builder.Default
    private List<PrescriptionItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PrescriptionItem {
        private String exerciseName;
        private Integer sets; // Series (ej. 3)
        private String repetitions; // Repeticiones o tiempo (ej. "12 reps" o "30 seg")
        private String frequency; // Frecuencia (ej. "2 veces al día", "Diario")
        private String notes; // Indicaciones técnicas
        private String videoUrl; // Link opcional a video demostrativo
    }
}
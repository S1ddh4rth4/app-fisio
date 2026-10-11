package com.fisitec.appfisio.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "patient_packages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Column(nullable = false)
    private String packageName; // Ej: "Paquete Rehabilitación 10 Sesiones"

    @Column(nullable = false)
    private Integer totalSessions;

    @Column(nullable = false)
    @Builder.Default
    private Integer usedSessions = 0;

    @Column(nullable = false)
    private BigDecimal totalPrice;

    @Column(nullable = false)
    private String paymentMethod; // EFECTIVO, TARJETA, TRANSFERENCIA

    @Column(nullable = false)
    @Builder.Default
    private String status = "ACTIVO"; // ACTIVO, AGOTADO, CANCELADO

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public boolean hasAvailableSessions() {
        return "ACTIVO".equalsIgnoreCase(this.status) && this.usedSessions < this.totalSessions;
    }

    public void consumeSession() {
        if (!hasAvailableSessions()) {
            throw new IllegalStateException("El paquete no cuenta con sesiones disponibles.");
        }
        this.usedSessions++;
        if (this.usedSessions >= this.totalSessions) {
            this.status = "AGOTADO";
        }
    }
}
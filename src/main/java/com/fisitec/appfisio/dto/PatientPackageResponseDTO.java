package com.fisitec.appfisio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientPackageResponseDTO {
    private String id;
    private String patientId;
    private String patientUsername;
    private String packageName;
    private Integer totalSessions;
    private Integer usedSessions;
    private Integer remainingSessions;
    private BigDecimal totalPrice;
    private String paymentMethod;
    private String status; // ACTIVO, AGOTADO, CANCELADO
    private LocalDateTime createdAt;
}
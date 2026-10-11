package com.fisitec.appfisio.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AppointmentResponseDTO {

    private Long id;
    private String patientId;
    private String patientName;
    private String professionalId;
    private String professionalName;
    private LocalDateTime appointmentDate;
    private String reason;
    private String status;
    private String paymentStatus;
    private BigDecimal paymentAmount;
    private String paymentMethod;
    private String packageName;
    private String clinicalNotes;
    private String treatmentName;
    private String appointmentType;
}
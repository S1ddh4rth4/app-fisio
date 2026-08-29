package com.fisitec.appfisio.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MedicalRecordResponseDTO {
    private String id;
    private String patientId;
    private String patientName;
    private String physiotherapistId;
    private String physiotherapistName;
    private Long appointmentId;
    private String diagnosis;
    private String notes;
    private LocalDateTime createdAt;
}
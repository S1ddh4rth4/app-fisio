package com.fisitec.appfisio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalHistoryResponseDTO {
    private String id;
    private String patientId;
    private String patientName;
    private String physiotherapistId;
    private String physiotherapistName;
    private String recordNumber;
    private String evaluationType;
    private String mainDiagnosis;
    private Integer painLevel;
    private String formDataJson;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
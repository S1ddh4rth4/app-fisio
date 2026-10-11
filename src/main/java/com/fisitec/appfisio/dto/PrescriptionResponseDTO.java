package com.fisitec.appfisio.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionResponseDTO {

    private String id;
    private String patientId;
    private String patientName;
    private String physiotherapistId;
    private String physiotherapistName;
    private String title;
    private String generalInstructions;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private List<PrescriptionItemDTO> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
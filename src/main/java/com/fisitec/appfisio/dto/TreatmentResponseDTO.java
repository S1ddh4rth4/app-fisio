package com.fisitec.appfisio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TreatmentResponseDTO {
    private String id;
    private String name;
    private String description;
    private Integer durationMinutes;
    private BigDecimal price;
    private String physiotherapistId;
    private String physiotherapistName;
}

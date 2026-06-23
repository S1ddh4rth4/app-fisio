package com.fisitec.appfisio.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class TreatmentResponseDTO {
    private String id;
    private String name;
    private String description;
    private Integer durationMinutes;
    private BigDecimal price;
}

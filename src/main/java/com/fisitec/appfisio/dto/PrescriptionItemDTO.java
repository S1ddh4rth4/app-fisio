package com.fisitec.appfisio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionItemDTO {

    @NotBlank(message = "El nombre del ejercicio es obligatorio")
    private String exerciseName;

    @Positive(message = "Las series deben ser un número positivo")
    private Integer sets;

    @NotBlank(message = "Las repeticiones o duración son obligatorias")
    private String repetitions;

    private String frequency;
    private String notes;
    private String videoUrl;
}
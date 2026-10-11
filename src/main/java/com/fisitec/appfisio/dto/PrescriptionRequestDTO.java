package com.fisitec.appfisio.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionRequestDTO {

    @NotBlank(message = "El ID o username del paciente es obligatorio")
    private String patientIdentifier;

    @NotBlank(message = "El título de la rutina es obligatorio")
    private String title;

    private String generalInstructions;

    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate startDate;

    private LocalDate endDate;

    @NotEmpty(message = "Debe incluir al menos un ejercicio en la prescripción")
    @Valid
    private List<PrescriptionItemDTO> items;
}
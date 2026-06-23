package com.fisitec.appfisio.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CalendarBookRequestDTO {

    @NotBlank(message = "El ID (o correo) del profesional es obligatorio.")
    private String profesionalID;

    @NotBlank(message = "El nombre del paciente es obligatorio.")
    private String pacienteName;

    @NotNull(message = "La fecha y hora de inicio son obligatorias.")
    private LocalDateTime startDateTime;

    @NotNull(message = "La fecha y hora de fin son obligatorias.")
    private LocalDateTime endDateTime;

    @NotBlank(message = "El motivo de la consulta es obligatorio.")
    private String reason;

}

package com.fisitec.appfisio.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AppointmentRequestDTO {

    // @NotBlank evita que nos envién textos vacíos o puros espacios
    @NotBlank(message = "El ID del paciente es obligatorio.")
    private String patientId;

    @NotBlank(message = "El ID del profesional es obligatorio.")
    private String professionalId;

    // @NotNull valida objetos (como fechas)
    // @FutureOrPresent garantiza que no agenden citas en el pasado
    @NotNull(message = "La fecha y hora de la cita es obligatoria.")
    @FutureOrPresent(message = "La cita no puede ser en el pasado.")
    private LocalDateTime appointmentDate;

    @NotBlank(message = "El motivo de la consulta es obligatorio.")
    private String reason;

}

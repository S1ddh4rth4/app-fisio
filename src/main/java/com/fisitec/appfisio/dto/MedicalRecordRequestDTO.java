package com.fisitec.appfisio.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MedicalRecordRequestDTO {

    @NotBlank(message = "El ID del paciente es obligatorio")
    private String patientId;

    // Nota: No pedimos el physiotherapistId porque lo sacaremos del Token
    // (Seguridad)

    private Long appointmentId; // Opcional, por si quieren ligarlo a una cita

    @NotBlank(message = "El diagnóstico es obligatorio")
    private String diagnosis;

    @NotBlank(message = "Las notas de la sesión son obligatorias")
    private String notes;
}
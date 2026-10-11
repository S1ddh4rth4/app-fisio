package com.fisitec.appfisio.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClinicalHistoryRequestDTO {

    // Si viene id, se actualiza la existente; si es null, se crea una nueva
    // evaluación
    private String id;

    @NotBlank(message = "El ID o usuario del paciente es obligatorio")
    private String patientId;

    private String recordNumber;
    private String evaluationType; // INICIAL, SEGUIMIENTO, ALTA
    private String mainDiagnosis;
    private Integer painLevel;

    @NotBlank(message = "Los datos del formulario clínico son obligatorios")
    private String formDataJson;
}
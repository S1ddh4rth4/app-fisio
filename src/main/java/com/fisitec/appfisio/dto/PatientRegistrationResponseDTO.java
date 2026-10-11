package com.fisitec.appfisio.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO específico para el Alta Rápida.
 * Expone la contraseña temporal por ÚNICA VEZ para que el Fisio la comparta.
 */
@Data
@Builder
public class PatientRegistrationResponseDTO {
    private String id;
    private String username;
    private String email;
    private String temporaryPassword; // <-- Aquí va la clave "Fisio-XXXX"
    private String primaryPhysioName;
}
package com.fisitec.appfisio.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO for quick patient registration by clinic staff.
 */
@Data
public class PatientRegisterRequestDTO {

    @NotBlank(message = "El nombre completo es obligatorio")
    private String fullName;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email debe ser válido")
    private String email;

    // --- Cumplimiento Legal ---
    @jakarta.validation.constraints.NotNull(message = "Debe aceptar el aviso de privacidad")
    @jakarta.validation.constraints.AssertTrue(message = "Debe aceptar el aviso de privacidad")
    private Boolean acceptsPrivacyPolicy;
}
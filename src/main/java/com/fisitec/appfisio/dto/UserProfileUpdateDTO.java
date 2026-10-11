package com.fisitec.appfisio.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Contrato de entrada para la actualización del perfil de usuario.
 * Aplica para todos los roles del sistema (Admin, Fisioterapeuta, Paciente,
 * Recepcionista).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileUpdateDTO {

    /**
     * Nombre completo del usuario.
     */
    @Size(max = 150, message = "El nombre completo no puede superar los 150 caracteres")
    private String fullName;

    /**
     * Número de teléfono de contacto móvil.
     */
    @Size(max = 30, message = "El teléfono no puede superar los 30 caracteres")
    private String phone;

    /**
     * Cédula profesional oficial (aplicable a fisioterapeutas o personal de salud).
     */
    @Size(max = 50, message = "La cédula profesional no puede superar los 50 caracteres")
    private String professionalLicense;

    /**
     * Imagen de avatar en formato Base64 o URL pública.
     */
    private String avatarUrl;
}
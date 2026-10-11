package com.fisitec.appfisio.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * Objeto de transferencia de datos (DTO) que representa la información pública
 * del usuario.
 * Estandarizado para devolver datos de perfil a todos los roles sin exponer
 * datos sensibles.
 */
@Data
public class UserDTO {

    /**
     * Identificador único inmutable (UUID).
     */
    private String id;

    /**
     * Nombre de usuario único para inicio de sesión.
     */
    private String username;

    /**
     * Correo electrónico del usuario.
     */
    private String email;

    /**
     * Nombre y apellidos completos del usuario.
     */
    private String fullName;

    /**
     * Teléfono móvil o de contacto.
     */
    private String phone;

    /**
     * Cédula profesional (para fisioterapeutas y personal clínico).
     */
    private String professionalLicense;

    /**
     * Fotografía de perfil o logotipo (URL o Base64).
     */
    private String avatarUrl;

    /**
     * Conjunto de roles de seguridad asignados en el sistema.
     */
    private Set<String> roles;

    /**
     * Estado activo/inactivo de la cuenta.
     */
    private Boolean enabled;

    /**
     * Fecha y hora de creación de la cuenta.
     */
    private LocalDateTime createdAt;

    /**
     * Fecha y hora de la última modificación del registro.
     */
    private LocalDateTime updatedAt;
}
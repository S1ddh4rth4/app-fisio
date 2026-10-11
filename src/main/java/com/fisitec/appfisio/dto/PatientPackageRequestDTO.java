package com.fisitec.appfisio.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PatientPackageRequestDTO {

    @NotBlank(message = "El identificador o username del paciente es obligatorio")
    private String patientIdentifier;

    @NotBlank(message = "El nombre del paquete es obligatorio (ej. Paquete Lumbalgia 10 Sesiones)")
    private String packageName;

    @NotNull(message = "El número total de sesiones es obligatorio")
    @Min(value = 1, message = "El paquete debe tener al menos 1 sesión")
    private Integer totalSessions;

    @NotNull(message = "El precio total es obligatorio")
    @Positive(message = "El precio total debe ser mayor a 0")
    private BigDecimal totalPrice;

    @NotBlank(message = "El método de pago es obligatorio (EFECTIVO, TARJETA, TRANSFERENCIA)")
    private String paymentMethod;
}
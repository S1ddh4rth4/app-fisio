package com.fisitec.appfisio.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AppointmentPaymentUpdateDTO {

    @NotBlank(message = "El estado del pago es obligatorio (PENDIENTE, PAGADO, PAQUETE, CORTESIA)")
    private String paymentStatus;

    private String paymentMethod; // EFECTIVO, TARJETA, TRANSFERENCIA, PAQUETE

    private BigDecimal amount;

    private String patientPackageId; // Opcional: ID del paquete si se descuenta de un bono
}
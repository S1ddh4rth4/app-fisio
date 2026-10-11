package com.fisitec.appfisio.controller;

import com.fisitec.appfisio.dto.AppointmentPaymentUpdateDTO;
import com.fisitec.appfisio.dto.AppointmentResponseDTO;
import com.fisitec.appfisio.dto.PatientPackageRequestDTO;
import com.fisitec.appfisio.dto.PatientPackageResponseDTO;
import com.fisitec.appfisio.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Vender / Registrar compra de un paquete de sesiones (Admin / Fisio).
     */
    @PostMapping("/packages")
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA')")
    public ResponseEntity<PatientPackageResponseDTO> buyPackage(@Valid @RequestBody PatientPackageRequestDTO request) {
        PatientPackageResponseDTO response = paymentService.buyPackage(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Obtener paquetes de un paciente (Admin, Fisio o el Paciente propio).
     */
    @GetMapping("/packages/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA', 'PACIENTE')")
    public ResponseEntity<List<PatientPackageResponseDTO>> getPatientPackages(
            @PathVariable String patientId,
            Authentication authentication) {

        boolean isPatient = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PACIENTE"));

        if (isPatient && !authentication.getName().equalsIgnoreCase(patientId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(paymentService.getPackagesByPatient(patientId));
    }

    /**
     * Actualizar estado de pago de una cita (Pagar consulta o descontar de
     * paquete).
     */
    @PutMapping("/appointments/{appointmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA')")
    public ResponseEntity<AppointmentResponseDTO> updateAppointmentPayment(
            @PathVariable Long appointmentId,
            @Valid @RequestBody AppointmentPaymentUpdateDTO updateDTO) {
        return ResponseEntity.ok(paymentService.updateAppointmentPayment(appointmentId, updateDTO));
    }
}
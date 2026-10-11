package com.fisitec.appfisio.controller;

import com.fisitec.appfisio.dto.PrescriptionRequestDTO;
import com.fisitec.appfisio.dto.PrescriptionResponseDTO;
import com.fisitec.appfisio.service.ExercisePrescriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/prescriptions")
@RequiredArgsConstructor
@Tag(name = "Prescripciones de Ejercicios", description = "Endpoints para prescripción de rutinas y planes de rehabilitación")
public class ExercisePrescriptionController {

    private final ExercisePrescriptionService prescriptionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA')")
    @Operation(summary = "Crear una nueva rutina de ejercicios para un paciente")
    public ResponseEntity<PrescriptionResponseDTO> createPrescription(
            @Valid @RequestBody PrescriptionRequestDTO request,
            Authentication authentication) {
        PrescriptionResponseDTO response = prescriptionService.createPrescription(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Obtener las rutinas prescritas a un paciente.
     * Con candado: El paciente únicamente puede solicitar sus propias
     * prescripciones.
     */
    @GetMapping("/patient/{patientIdentifier}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA', 'PACIENTE')")
    @Operation(summary = "Obtener las rutinas asignadas a un paciente con candado de privacidad")
    public ResponseEntity<List<PrescriptionResponseDTO>> getPatientPrescriptions(
            @PathVariable String patientIdentifier,
            Authentication authentication) {

        boolean isPatient = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PACIENTE"));

        // Candado de privacidad: un paciente no puede espiar rutinas de otros
        if (isPatient && !authentication.getName().equalsIgnoreCase(patientIdentifier)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(prescriptionService.getPatientPrescriptions(patientIdentifier));
    }

    // Listar las rutinas propias del usuario autenticado (o todas si es Admin)
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar las rutinas correspondientes al usuario autenticado")
    public ResponseEntity<List<PrescriptionResponseDTO>> getAllPrescriptions(Authentication authentication) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsForCurrentUser(authentication));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener el detalle de una prescripción por su ID")
    public ResponseEntity<PrescriptionResponseDTO> getPrescriptionById(@PathVariable String id) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionById(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA')")
    @Operation(summary = "Actualizar estado de la rutina (ACTIVA, COMPLETADA, CANCELADA)")
    public ResponseEntity<PrescriptionResponseDTO> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "ACTIVA");
        return ResponseEntity.ok(prescriptionService.updatePrescriptionStatus(id, status));
    }
}
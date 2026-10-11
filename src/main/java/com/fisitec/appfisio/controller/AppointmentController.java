package com.fisitec.appfisio.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.fisitec.appfisio.dto.AppointmentRequestDTO;
import com.fisitec.appfisio.dto.AppointmentResponseDTO;
import com.fisitec.appfisio.service.AppointmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    // Devuelve solo las citas del usuario autenticado (o todas si es Admin)
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AppointmentResponseDTO>> getAppointments(Authentication authentication) {
        List<AppointmentResponseDTO> appointments = appointmentService.getAppointmentsForCurrentUser(authentication);
        return ResponseEntity.ok(appointments);
    }

    /**
     * Obtener citas de un paciente con candado de identidad.
     */
    @GetMapping("/patient/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PACIENTE', 'FISIOTERAPEUTA')")
    public ResponseEntity<List<AppointmentResponseDTO>> getAppointmentsByPatientId(
            @PathVariable String id,
            Authentication authentication) {

        boolean isPatient = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PACIENTE"));

        // Seguridad: El paciente solo puede consultar su propio historial de citas
        if (isPatient && !authentication.getName().equalsIgnoreCase(id)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }

        List<AppointmentResponseDTO> appointments = appointmentService.getAppointmentsByPatient(id);
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/professional/{id}/today")
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA')")
    public ResponseEntity<List<AppointmentResponseDTO>> getTodayAppointmentsByProfessional(@PathVariable String id) {
        List<AppointmentResponseDTO> appointments = appointmentService.getTodayAppointmentsByProfessional(id);
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/professional/{id}/occupied-hours")
    @PreAuthorize("isAuthenticated()") // Cualquiera puede consultar horarios libres, sin ver nombres
    public ResponseEntity<List<String>> getOccupiedHours(
            @PathVariable String id,
            @RequestParam("date") String dateStr) {

        return ResponseEntity.ok(
                appointmentService.getOccupiedHours(id, java.time.LocalDate.parse(dateStr)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA', 'RECEPCION', 'PACIENTE')")
    public ResponseEntity<AppointmentResponseDTO> createAppointment(
            @Valid @RequestBody AppointmentRequestDTO request,
            org.springframework.security.core.Authentication authentication) {

        // Le pasamos el nombre de usuario autenticado al servicio
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(
                appointmentService.createAppointment(request, authentication.getName()));
    }

    // --- ÉPICA 4: Endpoints de Flujo Continuo ---
    @PatchMapping("/{id}/notes")
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA')")
    public ResponseEntity<AppointmentResponseDTO> updateNotes(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(appointmentService.saveClinicalNotes(id, body.get("notes")));
    }

    @PatchMapping("/{id}/pay")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'FISIOTERAPEUTA')")
    public ResponseEntity<AppointmentResponseDTO> processPayment(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(
                appointmentService.processPayment(id, body.get("treatmentId"), body.get("paymentMethod")));
    }
}
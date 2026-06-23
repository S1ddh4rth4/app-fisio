package com.fisitec.appfisio.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fisitec.appfisio.dto.AppointmentRequestDTO;
import com.fisitec.appfisio.dto.AppointmentResponseDTO;
import com.fisitec.appfisio.service.AppointmentService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;

import jakarta.validation.Valid;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    // ENDPOINT 1: /api/v1/appointments
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AppointmentResponseDTO>> getAllAppointments() {
        List<AppointmentResponseDTO> appointments = appointmentService.getAllAppointments();
        return ResponseEntity.ok(appointments);
    }

    // ENDPOINT 2: /api/v1/appointments/patient/{id}
    @GetMapping("/patient/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PACIENTE')")
    public ResponseEntity<List<AppointmentResponseDTO>> getAppointmentsByPatientId(@PathVariable String id) {
        List<AppointmentResponseDTO> appointments = appointmentService.getAppointmentsByPatient(id);
        return ResponseEntity.ok(appointments);
    }

    // ENDPOINT 3: /api/v1/appointments/professional/{id}/today
    @GetMapping("/professional/{id}/today")
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA')")
    public ResponseEntity<List<AppointmentResponseDTO>> getTodayAppointmentsByProfessional(@PathVariable String id) {
        List<AppointmentResponseDTO> appointments = appointmentService.getTodayAppointmentsByProfessional(id);
        return ResponseEntity.ok(appointments);
    }

    // ENDPOINT 4: Agendar una nueva cita
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PACIENTE', 'FISIOTERAPEUTA')")
    public ResponseEntity<AppointmentResponseDTO> createAppointment(@Valid @RequestBody AppointmentRequestDTO requestDTO) {
        AppointmentResponseDTO createdAppointment = appointmentService.createAppointment(requestDTO);
        return ResponseEntity.ok(createdAppointment);
    }
}

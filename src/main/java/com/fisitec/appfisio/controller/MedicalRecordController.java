package com.fisitec.appfisio.controller;

import com.fisitec.appfisio.dto.MedicalRecordRequestDTO;
import com.fisitec.appfisio.dto.MedicalRecordResponseDTO;
import com.fisitec.appfisio.service.MedicalRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/medical-records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;
    private final com.fisitec.appfisio.service.AuditService auditService; // <-- INYECTADO

    /**
     * Crear una ficha médica.
     * Solo los usuarios con rol FISIOTERAPEUTA o ADMIN pueden crear expedientes.
     * Obtenemos el username del Fisioterapeuta directamente del Token JWT mediante
     * Authentication.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA')")
    public ResponseEntity<MedicalRecordResponseDTO> createMedicalRecord(
            @Valid @RequestBody MedicalRecordRequestDTO request,
            Authentication authentication) {

        String currentUsername = authentication.getName();
        MedicalRecordResponseDTO response = medicalRecordService.createMedicalRecord(request, currentUsername);

        // BIG BROTHER: Registrar quién escribió la nota clínica
        auditService.logAction(
                currentUsername,
                "CREATE_MEDICAL_RECORD",
                request.getPatientId(),
                "Agregó una nueva nota de evolución al expediente.");

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Consultar el historial de un paciente.
     * Permitido para ADMIN, FISIOTERAPEUTA y PACIENTE.
     */
    /**
     * Consultar las notas de evolución de un paciente.
     * Con candado estricto: Un paciente jamás puede consultar notas de otros
     * pacientes.
     */
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA', 'PACIENTE')")
    public ResponseEntity<List<MedicalRecordResponseDTO>> getPatientMedicalRecords(
            @PathVariable String patientId,
            Authentication authentication) {

        boolean isPatient = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PACIENTE"));

        // Candado de seguridad: el paciente solo puede acceder a su propio expediente
        if (isPatient && !authentication.getName().equalsIgnoreCase(patientId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Auditoría clínica obligatoria
        auditService.logAction(
                authentication.getName(),
                "READ_MEDICAL_RECORD",
                patientId,
                "Consultó el historial clínico de evolución.");

        return ResponseEntity.ok(medicalRecordService.getPatientMedicalRecords(patientId));
    }
}
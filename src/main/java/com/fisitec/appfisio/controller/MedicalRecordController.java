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
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Consultar el historial de un paciente.
     * Permitido para ADMIN, FISIOTERAPEUTA y PACIENTE.
     */
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA', 'PACIENTE')")
    public ResponseEntity<List<MedicalRecordResponseDTO>> getPatientMedicalRecords(@PathVariable String patientId) {
        return ResponseEntity.ok(medicalRecordService.getPatientMedicalRecords(patientId));
    }
}
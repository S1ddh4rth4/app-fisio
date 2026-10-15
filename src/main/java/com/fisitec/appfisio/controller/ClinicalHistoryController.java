package com.fisitec.appfisio.controller;

import com.fisitec.appfisio.dto.ClinicalHistoryRequestDTO;
import com.fisitec.appfisio.dto.ClinicalHistoryResponseDTO;
import com.fisitec.appfisio.service.ClinicalHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clinical-histories")
@RequiredArgsConstructor
public class ClinicalHistoryController {

    private final ClinicalHistoryService historyService;

    /**
     * Guardar o actualizar historia clínica (Solo Fisios y Admin).
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA')")
    public ResponseEntity<ClinicalHistoryResponseDTO> saveHistory(
            @Valid @RequestBody ClinicalHistoryRequestDTO request,
            Authentication authentication) {
        ClinicalHistoryResponseDTO response = historyService.saveOrUpdateHistory(request, authentication.getName());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Obtener historial clínico de un paciente.
     * Si es PACIENTE, solo puede ver el suyo propio.
     */
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA', 'PACIENTE')")
    public ResponseEntity<List<ClinicalHistoryResponseDTO>> getPatientHistories(
            @PathVariable String patientId,
            Authentication authentication) {

        boolean isStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_FISIOTERAPEUTA"));

        return ResponseEntity.ok(historyService.getHistoriesByPatient(patientId, authentication.getName(), isStaff));
    }

    /**
     * Obtener una historia clínica por su ID con verificación estricta de
     * pertenencia.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA', 'PACIENTE')")
    public ResponseEntity<ClinicalHistoryResponseDTO> getHistoryById(
            @PathVariable String id,
            Authentication authentication) {

        boolean isStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_FISIOTERAPEUTA"));

        return ResponseEntity.ok(historyService.getHistoryById(id, authentication.getName(), isStaff));
    }
}
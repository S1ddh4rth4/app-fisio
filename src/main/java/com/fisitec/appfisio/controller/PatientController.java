package com.fisitec.appfisio.controller;

import com.fisitec.appfisio.dto.PatientRegisterRequestDTO;
import com.fisitec.appfisio.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;
    private final com.fisitec.appfisio.service.UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA', 'RECEPCION')")
    public ResponseEntity<?> getPatients(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            Authentication authentication) {
        boolean isStaffAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_RECEPCION"));

        // Modo Paginado: Si el cliente envía 'page', paginamos y limitamos a max 100
        // por petición
        if (page != null) {
            int pageSize = (size != null && size > 0 && size <= 100) ? size : 20;
            Pageable pageable = PageRequest.of(page, pageSize);
            return ResponseEntity
                    .ok(patientService.getPatientsForUserPaged(authentication.getName(), isStaffAdmin, pageable));
        }

        // Modo Plano: Retrocompatibilidad total con el frontend actual
        return ResponseEntity.ok(patientService.getPatientsForUser(authentication.getName(), isStaffAdmin));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA', 'RECEPCION')")
    public ResponseEntity<com.fisitec.appfisio.dto.PatientRegistrationResponseDTO> registerPatient(
            @Valid @RequestBody PatientRegisterRequestDTO request,
            Authentication authentication) {

        // Le pasamos authentication.getName() para saber qué Fisio hizo la petición
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(patientService.registerPatient(request, authentication.getName()));
    }

    @PatchMapping("/{patientId}/assign-physio")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.fisitec.appfisio.dto.UserDTO> assignPhysiotherapist(
            @PathVariable String patientId,
            @RequestParam String physioUsername,
            Authentication authentication) {
        return ResponseEntity.ok(
                patientService.assignPhysiotherapist(patientId, physioUsername, authentication.getName()));
    }

    // Borrado inteligente (si fue creado por error) o Derecho al Olvido (si ya
    // tiene historial)
    @DeleteMapping("/{patientId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.Map<String, String>> deletePatient(
            @PathVariable String patientId,
            Authentication authentication) {
        String resultMessage = userService.deleteAndAnonymizePatient(patientId, authentication.getName());
        return ResponseEntity.ok(java.util.Map.of("message", resultMessage));
    }
}
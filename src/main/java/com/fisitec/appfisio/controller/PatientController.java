package com.fisitec.appfisio.controller;

import com.fisitec.appfisio.dto.PatientRegisterRequestDTO;
import com.fisitec.appfisio.dto.UserDTO;
import com.fisitec.appfisio.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;
    private final com.fisitec.appfisio.service.UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA', 'RECEPCION')")
    public ResponseEntity<List<UserDTO>> getPatients(Authentication authentication) {
        boolean isStaffAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_RECEPCION"));

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

    // Endpoint exclusivo de la Fase 4 (Derecho al Olvido)
    @DeleteMapping("/{patientId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePatient(@PathVariable String patientId, Authentication authentication) {
        userService.deleteAndAnonymizePatient(patientId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
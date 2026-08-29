package com.fisitec.appfisio.controller;

import com.fisitec.appfisio.dto.UserDTO;
//import com.fisitec.appfisio.entity.Appointment;
import com.fisitec.appfisio.entity.User;
import com.fisitec.appfisio.repository.AppointmentRepository;
import com.fisitec.appfisio.repository.UserRepository;
import com.fisitec.appfisio.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Controller for managing and querying clinic patients.
 */
@RestController
@RequestMapping("/api/v1/patients")
@RequiredArgsConstructor
public class PatientController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final AppointmentRepository appointmentRepository;

    /**
     * Get patients based on user role:
     * - ADMIN / RECEPCION: sees all patients.
     * - FISIOTERAPEUTA: sees only patients assigned to them via appointments.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA', 'RECEPCION')")
    public ResponseEntity<List<UserDTO>> getPatients(Authentication authentication) {
        String currentUsername = authentication.getName();
        boolean isStaffAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_RECEPCION"));

        if (isStaffAdmin) {
            // Admin y Recepción ven todos los pacientes
            List<UserDTO> allPatients = userRepository.findAll().stream()
                    .filter(user -> user.getRoles().stream().anyMatch(r -> "ROLE_PACIENTE".equals(r.getName())))
                    .map(userService::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(allPatients);
        }

        // Si es Fisioterapeuta: obtener los IDs de pacientes que tienen citas con él
        User physio = userRepository.findByUsername(currentUsername).orElse(null);
        if (physio == null) {
            return ResponseEntity.ok(List.of());
        }

        // Filtrar citas del fisioterapeuta actual
        Set<String> patientIds = appointmentRepository.findAll().stream()
                .filter(app -> app.getProfessional() != null && app.getProfessional().getId().equals(physio.getId()))
                .map(app -> app.getPatient().getId())
                .collect(Collectors.toSet());

        List<UserDTO> myPatients = userRepository.findAllById(patientIds).stream()
                .map(userService::convertToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(myPatients);
    }
}
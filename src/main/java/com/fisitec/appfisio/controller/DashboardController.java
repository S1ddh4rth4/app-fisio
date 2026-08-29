package com.fisitec.appfisio.controller;

import com.fisitec.appfisio.dto.AppointmentResponseDTO;
import com.fisitec.appfisio.dto.DashboardSummaryDTO;
import com.fisitec.appfisio.repository.TreatmentRepository;
import com.fisitec.appfisio.repository.UserRepository;
import com.fisitec.appfisio.service.AppointmentService;
import com.fisitec.appfisio.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final UserRepository userRepository;
    private final TreatmentRepository treatmentRepository;
    private final AppointmentService appointmentService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA', 'RECEPCION')")
    public ResponseEntity<DashboardSummaryDTO> getSummary(
            org.springframework.security.core.Authentication authentication) {
        String currentUsername = authentication.getName();
        boolean isStaffAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_RECEPCION"));

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        // 1. Citas de hoy (Si es Fisio, solo sus citas de hoy; si es Admin, todas)
        List<AppointmentResponseDTO> allAppointments = appointmentService.getAllAppointments();
        List<AppointmentResponseDTO> todayAppointments = allAppointments.stream()
                .filter(a -> {
                    LocalDateTime date = a.getAppointmentDate();
                    boolean isToday = date != null && !date.isBefore(startOfDay) && !date.isAfter(endOfDay);
                    if (!isToday)
                        return false;
                    return isStaffAdmin
                            || (a.getProfessionalName() != null && a.getProfessionalName().equals(currentUsername));
                })
                .collect(Collectors.toList());

        // 2. Conteo de pacientes (Si es Fisio, solo los que tienen citas con él)
        long patientCount;
        if (isStaffAdmin) {
            patientCount = userRepository.findAll().stream()
                    .filter(u -> u.getRoles().stream().anyMatch(r -> "ROLE_PACIENTE".equals(r.getName())))
                    .count();
        } else {
            // Obtener el ID del fisio logueado
            User currentPhysio = userRepository.findByUsername(currentUsername).orElse(null);
            String currentPhysioId = currentPhysio != null ? currentPhysio.getId() : "";

            // Contar pacientes únicos que tienen citas con este fisioterapeuta
            patientCount = allAppointments.stream()
                    .filter(a -> (a.getProfessionalName() != null
                            && a.getProfessionalName().equalsIgnoreCase(currentUsername))
                            || (a.getProfessionalId() != null && a.getProfessionalId().equals(currentPhysioId)))
                    .map(a -> a.getPatientId())
                    .distinct()
                    .count();
        }

        // 3. Conteo de tratamientos
        long treatmentCount = treatmentRepository.count();

        DashboardSummaryDTO summary = DashboardSummaryDTO.builder()
                .todayAppointmentsCount(todayAppointments.size())
                .totalPatientsCount(patientCount)
                .totalTreatmentsCount(treatmentCount)
                .upcomingAppointments(todayAppointments.stream().limit(5).collect(Collectors.toList()))
                .build();

        return ResponseEntity.ok(summary);
    }
}
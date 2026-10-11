package com.fisitec.appfisio.service;

import com.fisitec.appfisio.dto.AppointmentResponseDTO;
import com.fisitec.appfisio.dto.DashboardSummaryDTO;
import com.fisitec.appfisio.entity.User;
import com.fisitec.appfisio.repository.AppointmentRepository;
import com.fisitec.appfisio.repository.TreatmentRepository;
import com.fisitec.appfisio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for dashboard summary data.
 * Uses efficient repository queries instead of loading all records into memory.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final TreatmentRepository treatmentRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentService appointmentService;

    @Transactional(readOnly = true)
    public DashboardSummaryDTO getSummary(String currentUsername, boolean isStaffAdmin) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        // 1. Today's appointments (efficient query)
        List<AppointmentResponseDTO> todayAppointments;
        if (isStaffAdmin) {
            todayAppointments = appointmentRepository
                    .findByAppointmentDateBetweenOrderByAppointmentDateAsc(startOfDay, endOfDay)
                    .stream()
                    .map(a -> AppointmentResponseDTO.builder()
                            .id(a.getId())
                            .patientId(a.getPatient().getId())
                            .patientName(a.getPatient().getUsername())
                            .professionalId(a.getProfessional().getId())
                            .professionalName(a.getProfessional().getUsername())
                            .appointmentDate(a.getAppointmentDate())
                            .reason(a.getReason())
                            .status(a.getStatus())
                            .paymentStatus(a.getPaymentStatus())
                            .paymentAmount(a.getPaymentAmount())
                            .build())
                    .collect(Collectors.toList());
        } else {
            todayAppointments = appointmentService.getTodayAppointmentsByProfessional(currentUsername);
        }

        // 2. Conteo de pacientes en la cartera del fisioterapeuta
        long patientCount;
        if (isStaffAdmin) {
            // El administrador o recepción ven el padrón total de pacientes de la clínica
            patientCount = userRepository.countByRoles_Name("ROLE_PACIENTE");
        } else {
            // El fisioterapeuta ve a sus pacientes con citas + los registrados en su
            // cartera
            User physio = userRepository.findByUsername(currentUsername).orElse(null);
            if (physio != null) {
                java.util.Set<String> patientIds = new java.util.HashSet<>(
                        appointmentRepository.findDistinctPatientIdsByProfessionalId(physio.getId()));

                // Incluimos también a los pacientes recién creados aunque aún no tengan cita
                userRepository.findByPrimaryPhysio(physio).forEach(p -> patientIds.add(p.getId()));

                patientCount = patientIds.size();
            } else {
                patientCount = 0;
            }
        }

        // 3. Conteo de tratamientos (Aislamiento por Fisioterapeuta)
        long treatmentCount;
        if (isStaffAdmin) {
            // El administrador visualiza el catálogo global de toda la clínica
            treatmentCount = treatmentRepository.count();
        } else {
            // El fisioterapeuta visualiza exclusivamente los tratamientos de su autoría
            User physio = userRepository.findByUsername(currentUsername).orElse(null);
            treatmentCount = (physio != null) ? treatmentRepository.findByPhysiotherapist(physio).size() : 0;
        }

        // 4. Corte de caja: Ingresos del día (Individualizado)
        // Calcula lo recaudado hoy para las citas visibles (para admin: toda la
        // clínica; para fisio: sus consultas)
        java.math.BigDecimal totalIncome = todayAppointments.stream()
                .filter(a -> "PAGADO".equals(a.getPaymentStatus()) && a.getPaymentAmount() != null)
                .map(a -> a.getPaymentAmount())
                .reduce(java.math.BigDecimal.ZERO, (total, current) -> total.add(current));

        return DashboardSummaryDTO.builder()
                .todayAppointmentsCount(todayAppointments.size())
                .totalPatientsCount(patientCount)
                .totalTreatmentsCount(treatmentCount)
                .upcomingAppointments(todayAppointments.stream().limit(5).collect(Collectors.toList()))
                .totalIncomeToday(totalIncome) // Pasamos el dinero al Frontend
                .build();
    }
}
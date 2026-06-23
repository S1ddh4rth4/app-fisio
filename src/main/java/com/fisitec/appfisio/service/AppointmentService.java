package com.fisitec.appfisio.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.fisitec.appfisio.dto.AppointmentRequestDTO;
import com.fisitec.appfisio.dto.AppointmentResponseDTO;
import com.fisitec.appfisio.entity.Appointment;
import com.fisitec.appfisio.entity.User;
import com.fisitec.appfisio.repository.AppointmentRepository;
import com.fisitec.appfisio.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;

    // 1.Obtener todas las citas (Administración)
    public List<AppointmentResponseDTO> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .map(this::mapToDTO)
                .toList();

    }

    // 2. Obtener citas por paciente
    public List<AppointmentResponseDTO> getAppointmentsByPatient(String patientId) {
        return appointmentRepository.findByPatientId(patientId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    // 3. Obtener citas de hoy para un profesional
    public List<AppointmentResponseDTO> getTodayAppointmentsByProfessional(String professionalId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        return appointmentRepository.findByProfessionalIdAndAppointmentDateBetween(
                professionalId, startOfDay, endOfDay).stream()
                .map(this::mapToDTO)
                .toList();
    }

    // Método privado para convertir Entidad a DTO
    private AppointmentResponseDTO mapToDTO(Appointment appointment) {
        return new AppointmentResponseDTO(
                appointment.getId(),
                appointment.getPatient().getId(),
                appointment.getPatient().getUsername(),
                appointment.getProfessional().getId(),
                appointment.getProfessional().getUsername(),
                appointment.getAppointmentDate(),
                appointment.getReason(),
                appointment.getStatus());
    }

    // 4. ENDPOINT 4: Crear una nueva cita
    @Transactional
    public AppointmentResponseDTO createAppointment(AppointmentRequestDTO requestDTO) {

        // Buscar paciente (Usamos IllegalArgumentException para que el
        // GlobalExceptionHandler devuelva un 400 Bad Request)
        String patientId = java.util.Objects.requireNonNull(requestDTO.getPatientId());
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Paciente no encontrado con ID: " + requestDTO.getPatientId()));

        // Buscar profesional
        String professionalId = java.util.Objects.requireNonNull(requestDTO.getProfessionalId());
        User professional = userRepository.findById(professionalId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Profesional no encontrado con ID: " + requestDTO.getProfessionalId()));

        // Crear la entidad
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setProfessional(professional);
        appointment.setAppointmentDate(requestDTO.getAppointmentDate());
        appointment.setReason(requestDTO.getReason());

        // Guardar
        Appointment savedAppointment = appointmentRepository.save(appointment);

        // Devolver DTO
        return mapToDTO(savedAppointment);
    }
}

package com.fisitec.appfisio.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fisitec.appfisio.dto.AppointmentRequestDTO;
import com.fisitec.appfisio.dto.AppointmentResponseDTO;
import com.fisitec.appfisio.entity.Appointment;
import com.fisitec.appfisio.entity.User;
import com.fisitec.appfisio.entity.Treatment;
import com.fisitec.appfisio.repository.AppointmentRepository;
import com.fisitec.appfisio.repository.TreatmentRepository;
import com.fisitec.appfisio.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AppointmentService {

        private final UserRepository userRepository;
        private final AppointmentRepository appointmentRepository;
        private final GoogleCalendarService googleCalendarService;
        private final TreatmentRepository treatmentRepository;

        // Obtener todas las citas globales (utilizado por el Dashboard y Admin)
        @Transactional(readOnly = true)
        public List<AppointmentResponseDTO> getAllAppointments() {
                return appointmentRepository.findAll().stream()
                                .map(this::mapToDTO)
                                .toList();
        }

        // Obtener citas con aislamiento estricto según el usuario autenticado
        @Transactional(readOnly = true)
        public List<AppointmentResponseDTO> getAppointmentsForCurrentUser(Authentication authentication) {
                String username = authentication.getName();
                boolean isAdmin = authentication.getAuthorities().stream()
                                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                boolean isFisio = authentication.getAuthorities().stream()
                                .anyMatch(a -> a.getAuthority().equals("ROLE_FISIOTERAPEUTA"));

                if (isAdmin) {
                        return getAllAppointments();
                }

                if (isFisio) {
                        User professional = findUserByIdOrUsername(username);
                        return appointmentRepository
                                        .findByProfessionalIdOrderByAppointmentDateDesc(professional.getId()).stream()
                                        .map(this::mapToDTO)
                                        .toList();
                }

                // Paciente
                User patient = findUserByIdOrUsername(username);
                return appointmentRepository.findByPatientId(patient.getId()).stream()
                                .map(this::mapToDTO)
                                .toList();
        }

        // Obtener citas por paciente
        @Transactional(readOnly = true)
        public List<AppointmentResponseDTO> getAppointmentsByPatient(String patientIdentifier) {
                User patient = findUserByIdOrUsername(patientIdentifier);
                return appointmentRepository.findByPatientId(patient.getId()).stream()
                                .map(this::mapToDTO)
                                .toList();
        }

        // Obtener citas de hoy para un profesional
        @Transactional(readOnly = true)
        public List<AppointmentResponseDTO> getTodayAppointmentsByProfessional(String professionalIdentifier) {
                User professional = findUserByIdOrUsername(professionalIdentifier);
                LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
                LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

                return appointmentRepository.findByProfessionalIdAndAppointmentDateBetweenOrderByAppointmentDateAsc(
                                professional.getId(), startOfDay, endOfDay).stream()
                                .map(this::mapToDTO)
                                .toList();
        }

        // Devolver SOLO las horas ocupadas (String) para proteger la privacidad del
        // paciente
        @Transactional(readOnly = true)
        public java.util.List<String> getOccupiedHours(String professionalIdentifier, java.time.LocalDate date) {
                User professional = findUserByIdOrUsername(professionalIdentifier);
                java.time.LocalDateTime startOfDay = date.atStartOfDay();
                java.time.LocalDateTime endOfDay = date.atTime(java.time.LocalTime.MAX);

                return appointmentRepository.findByProfessionalIdAndAppointmentDateBetweenOrderByAppointmentDateAsc(
                                professional.getId(), startOfDay, endOfDay).stream()
                                .map(appt -> String.format("%02d:00", appt.getAppointmentDate().getHour()))
                                .toList();
        }

        // Crear una nueva cita con validaciones de 60 minutos y auto-asignación
        // segura
        @Transactional
        public AppointmentResponseDTO createAppointment(AppointmentRequestDTO requestDTO, String currentUsername) {
                LocalDateTime requestedDate = requestDTO.getAppointmentDate();

                if (requestedDate.isBefore(LocalDateTime.now())) {
                        throw new IllegalArgumentException("No es posible agendar citas en fechas u horas pasadas.");
                }

                // Seguridad y Auto-asignación correcta
                User currentUser = findUserByIdOrUsername(currentUsername);
                User patient;
                User professional;

                boolean isPatient = currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_PACIENTE"));
                boolean isFisio = currentUser.getRoles().stream()
                                .anyMatch(r -> r.getName().equals("ROLE_FISIOTERAPEUTA"));

                if (isPatient) {
                        patient = currentUser; // Seguridad: un paciente solo puede agendarse a sí mismo
                        professional = findUserByIdOrUsername(requestDTO.getProfessionalId());
                } else {
                        patient = findUserByIdOrUsername(requestDTO.getPatientId());
                        if (isFisio) {
                                professional = currentUser; // Seguridad: Fisio solo se agenda a sí mismo
                        } else {
                                // Admin / Recepción pueden elegir al fisio libremente
                                professional = findUserByIdOrUsername(requestDTO.getProfessionalId());
                        }
                }

                LocalDateTime slotStart = requestedDate.minusMinutes(59);
                LocalDateTime slotEnd = requestedDate.plusMinutes(59);

                boolean isTherapistBusy = appointmentRepository
                                .existsByProfessionalIdAndAppointmentDateBetween(professional.getId(), slotStart,
                                                slotEnd);

                if (isTherapistBusy) {
                        throw new IllegalArgumentException(
                                        "El fisioterapeuta " + professional.getUsername()
                                                        + " ya tiene una sesión agendada en ese rango horario.");
                }

                boolean isPatientBusy = appointmentRepository
                                .existsByPatientIdAndAppointmentDateBetween(patient.getId(), slotStart, slotEnd);

                if (isPatientBusy) {
                        throw new IllegalArgumentException(
                                        "El paciente " + patient.getUsername()
                                                        + " ya cuenta con otra cita programada en ese rango horario.");
                }

                Appointment appointment = new Appointment();
                appointment.setPatient(patient);
                appointment.setProfessional(professional);
                appointment.setAppointmentDate(requestedDate);
                appointment.setReason(requestDTO.getReason());

                // Guardamos el tipo de cita que el usuario haya seleccionado en el ComboBox
                if (requestDTO.getAppointmentType() != null && !requestDTO.getAppointmentType().isBlank()) {
                        appointment.setAppointmentType(requestDTO.getAppointmentType());
                } else {
                        appointment.setAppointmentType("VALORACION_INICIAL");
                }

                appointment.setStatus("SCHEDULED");
                appointment.setPaymentStatus("PENDIENTE");

                Appointment savedAppointment = appointmentRepository.save(appointment);

                try {
                        com.fisitec.appfisio.dto.CalendarBookRequestDTO googleReq = new com.fisitec.appfisio.dto.CalendarBookRequestDTO();
                        googleReq.setProfesionalID(professional.getUsername());

                        // REQUISITO DE NEGOCIO: Mostrar nombres reales
                        googleReq.setPacienteName(patient.getUsername() + " con Fisio " + professional.getUsername());
                        googleReq.setStartDateTime(requestedDate);
                        googleReq.setEndDateTime(requestedDate.plusMinutes(60)); // Sesión de 1 hr
                        googleReq.setReason("Sesión Clínica Reservada");

                        googleCalendarService.bookSlot(googleReq);

                } catch (Exception e) {
                        // Si falla Google (ej. sin internet), no queremos borrar la cita de Oracle.
                        System.err.println("Fallo al sincronizar con Google: " + e.getMessage());
                }

                return mapToDTO(savedAppointment);
        }

        private User findUserByIdOrUsername(String identifier) {
                return userRepository.findById(identifier)
                                .or(() -> userRepository.findByUsername(identifier))
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Usuario no encontrado: " + identifier));
        }

        // Épica 4: Guardar notas clínicas
        @org.springframework.transaction.annotation.Transactional
        public AppointmentResponseDTO saveClinicalNotes(Long id, String notes) {
                Appointment appt = appointmentRepository.findById(id).orElseThrow();
                appt.setClinicalNotes(notes);
                return mapToDTO(appointmentRepository.save(appt));
        }

        // Épica 4: Cobrar consulta y enlazar tratamiento
        @org.springframework.transaction.annotation.Transactional
        public AppointmentResponseDTO processPayment(Long id, String treatmentId, String paymentMethod) {
                Appointment appt = appointmentRepository.findById(id).orElseThrow();
                Treatment treatment = treatmentRepository.findById(treatmentId).orElseThrow();

                appt.setTreatment(treatment);
                appt.setPaymentMethod(paymentMethod);
                appt.setPaymentAmount(treatment.getPrice());
                appt.setPaymentStatus("PAGADO");
                appt.setStatus("COMPLETED"); // Cerramos la cita automáticamente al pagarla

                return mapToDTO(appointmentRepository.save(appt));
        }

        private AppointmentResponseDTO mapToDTO(Appointment appointment) {
                return AppointmentResponseDTO.builder()
                                .id(appointment.getId())
                                .patientId(appointment.getPatient().getId())
                                .patientName(appointment.getPatient().getUsername())
                                .professionalId(appointment.getProfessional().getId())
                                .professionalName(appointment.getProfessional().getUsername())
                                .appointmentDate(appointment.getAppointmentDate())
                                .reason(appointment.getReason())
                                .status(appointment.getStatus() != null ? appointment.getStatus() : "SCHEDULED")
                                .paymentStatus(appointment.getPaymentStatus() != null ? appointment.getPaymentStatus()
                                                : "PENDIENTE")
                                .paymentAmount(appointment.getPaymentAmount())
                                .paymentMethod(appointment.getPaymentMethod())
                                .packageName(appointment.getPatientPackage() != null
                                                ? appointment.getPatientPackage().getPackageName()
                                                : null)
                                .clinicalNotes(appointment.getClinicalNotes())
                                .appointmentType(appointment.getAppointmentType())
                                .treatmentName(appointment.getTreatment() != null ? appointment.getTreatment().getName()
                                                : null)
                                .build();
        }
}
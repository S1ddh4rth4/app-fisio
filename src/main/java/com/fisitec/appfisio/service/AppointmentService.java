package com.fisitec.appfisio.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
        private final com.fisitec.appfisio.repository.PatientPackageRepository patientPackageRepository;
        private final AuditService auditService;
        private final EmailService emailService;

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

        // Obtener citas paginadas con aislamiento estricto
        @Transactional(readOnly = true)
        public Page<AppointmentResponseDTO> getAppointmentsForCurrentUserPaged(Authentication authentication,
                        Pageable pageable) {
                String username = authentication.getName();
                boolean isAdmin = authentication.getAuthorities().stream()
                                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                boolean isFisio = authentication.getAuthorities().stream()
                                .anyMatch(a -> a.getAuthority().equals("ROLE_FISIOTERAPEUTA"));

                if (isAdmin) {
                        return appointmentRepository.findAll(pageable).map(this::mapToDTO);
                }

                if (isFisio) {
                        User professional = findUserByIdOrUsername(username);
                        return appointmentRepository
                                        .findByProfessionalIdOrderByAppointmentDateDesc(professional.getId(), pageable)
                                        .map(this::mapToDTO);
                }

                // Paciente
                User patient = findUserByIdOrUsername(username);
                return appointmentRepository
                                .findByPatientIdOrderByAppointmentDateDesc(patient.getId(), pageable)
                                .map(this::mapToDTO);
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
                        User assignedPhysio = patient.getPrimaryPhysio();
                        if (assignedPhysio != null && assignedPhysio.getRoles() != null
                                        && assignedPhysio.getRoles().stream()
                                                        .anyMatch(r -> "ROLE_FISIOTERAPEUTA".equals(r.getName()))) {
                                professional = assignedPhysio;
                        } else {
                                professional = findUserByIdOrUsername(requestDTO.getProfessionalId());
                                patient.setPrimaryPhysio(professional);
                                userRepository.save(patient);
                        }
                } else {
                        patient = findUserByIdOrUsername(requestDTO.getPatientId());
                        if (isFisio) {
                                professional = currentUser; // Seguridad: Fisio solo se agenda a sí mismo
                        } else {
                                // Admin / Recepción pueden elegir al fisio libremente
                                professional = findUserByIdOrUsername(requestDTO.getProfessionalId());
                        }
                        User assignedPhysio = patient.getPrimaryPhysio();
                        if (assignedPhysio == null || assignedPhysio.getRoles() == null
                                        || assignedPhysio.getRoles().stream()
                                                        .noneMatch(r -> "ROLE_FISIOTERAPEUTA".equals(r.getName()))) {
                                patient.setPrimaryPhysio(professional);
                                userRepository.save(patient);
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

                // Disparo de correos transaccionales de confirmación con recomendaciones de
                // vestimenta (Punto 12)
                try {
                        emailService.sendAppointmentConfirmation(savedAppointment);
                } catch (Exception ex) {
                        System.err.println("Error no bloqueante enviando correo de confirmación: " + ex.getMessage());
                }

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

        // Épica 4: Guardar notas clínicas con candado de pertenencia (BOLA/IDOR)
        @org.springframework.transaction.annotation.Transactional
        public AppointmentResponseDTO saveClinicalNotes(Long id, String notes, Authentication authentication) {
                Appointment appt = appointmentRepository.findById(id).orElseThrow();
                validateAppointmentOwnership(appt, authentication);
                appt.setClinicalNotes(notes);
                return mapToDTO(appointmentRepository.save(appt));
        }

        // Épica 4: Cobrar consulta y enlazar tratamiento con candado de pertenencia
        // (BOLA/IDOR)
        @org.springframework.transaction.annotation.Transactional
        public AppointmentResponseDTO processPayment(Long id, String treatmentId, String paymentMethod,
                        Authentication authentication) {
                Appointment appt = appointmentRepository.findById(id).orElseThrow();
                validateAppointmentOwnership(appt, authentication);
                Treatment treatment = treatmentRepository.findById(treatmentId).orElseThrow();

                appt.setTreatment(treatment);
                appt.setPaymentMethod(paymentMethod);
                appt.setPaymentAmount(treatment.getPrice());
                appt.setPaymentStatus("PAGADO");
                appt.setStatus("COMPLETED"); // Cerramos la cita automáticamente al pagarla

                Appointment paidAppt = appointmentRepository.save(appt);
                AppointmentResponseDTO responseDTO = mapToDTO(paidAppt);

                // Disparo de correo de resumen clínico y comprobante de atención (Punto 13)
                // Se invoca después de mapToDTO para garantizar que las entidades LAZY ya están
                // inicializadas
                try {
                        emailService.sendSessionSummary(paidAppt);
                } catch (Exception ex) {
                        System.err.println("Error no bloqueante enviando resumen de sesión: " + ex.getMessage());
                }

                return responseDTO;
        }

        // Revertir cobro registrado por error y restaurar sesión de paquete si aplica
        @org.springframework.transaction.annotation.Transactional
        public AppointmentResponseDTO revertPayment(Long id, Authentication authentication) {
                Appointment appt = appointmentRepository.findById(id).orElseThrow();
                validateAppointmentOwnership(appt, authentication);

                if (!"PAGADO".equalsIgnoreCase(appt.getPaymentStatus())) {
                        throw new IllegalStateException("Esta cita no cuenta con un cobro registrado para revertir.");
                }

                String previousMethod = appt.getPaymentMethod();
                java.math.BigDecimal previousAmount = appt.getPaymentAmount();

                // Si se había cobrado descontando de un paquete, devolver +1 sesión al paquete
                if (appt.getPatientPackage() != null) {
                        com.fisitec.appfisio.entity.PatientPackage pkg = appt.getPatientPackage();
                        pkg.refundSession();
                        if (patientPackageRepository != null) {
                                patientPackageRepository.save(pkg);
                        }
                        appt.setPatientPackage(null);
                }

                appt.setTreatment(null);
                appt.setPaymentMethod(null);
                appt.setPaymentAmount(null);
                appt.setPaymentStatus("PENDIENTE");
                appt.setStatus("SCHEDULED");

                Appointment revertedAppt = appointmentRepository.save(appt);

                if (authentication != null && auditService != null) {
                        String targetPatientId = appt.getPatient() != null ? appt.getPatient().getId() : "N/A";
                        auditService.logAction(
                                        authentication.getName(),
                                        "REVERT_PAYMENT",
                                        targetPatientId,
                                        "Revirtió el cobro de la cita #" + id + " (Método previo: " + previousMethod
                                                        + ", Monto previo: $" + previousAmount + ")");
                }

                return mapToDTO(revertedAppt);
        }

        // Cancelar una cita pendiente y liberar el horario en la agenda
        @org.springframework.transaction.annotation.Transactional
        public void cancelAppointment(Long id, Authentication authentication) {
                Appointment appt = appointmentRepository.findById(id)
                                .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada con ID: " + id));

                boolean isAdminOrReception = false;
                boolean isAssignedPhysio = false;
                boolean isOwnPatient = false;

                if (authentication != null) {
                        isAdminOrReception = authentication.getAuthorities().stream()
                                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                                                        || a.getAuthority().equals("ROLE_RECEPCION"));
                        isAssignedPhysio = appt.getProfessional() != null
                                        && appt.getProfessional().getUsername()
                                                        .equalsIgnoreCase(authentication.getName());
                        isOwnPatient = appt.getPatient() != null
                                        && appt.getPatient().getUsername().equalsIgnoreCase(authentication.getName());

                        if (!isAdminOrReception && !isAssignedPhysio && !isOwnPatient) {
                                throw new org.springframework.security.access.AccessDeniedException(
                                                "No tienes permisos para cancelar esta cita.");
                        }

                        // Candado de 24 horas para pacientes: si faltan menos de 24h, debe contactar a
                        // su fisioterapeuta
                        if (isOwnPatient && !isAdminOrReception && !isAssignedPhysio) {
                                if (appt.getAppointmentDate() != null
                                                && appt.getAppointmentDate()
                                                                .isBefore(LocalDateTime.now().plusHours(24))) {
                                        throw new IllegalStateException(
                                                        "Por política de agenda, las citas con menos de 24 horas de anticipación ya cuentan con logística reservada y no pueden cancelarse en línea. Por favor comunícate directamente con tu fisioterapeuta.");
                                }
                        }
                }

                if ("PAGADO".equalsIgnoreCase(appt.getPaymentStatus())) {
                        throw new IllegalStateException(
                                        "No se puede cancelar una cita que ya fue cobrada. Si fue un error, primero revierte el cobro en la pestaña Caja.");
                }

                String targetPatientId = appt.getPatient() != null ? appt.getPatient().getId() : "N/A";
                LocalDateTime apptDate = appt.getAppointmentDate();

                appointmentRepository.delete(appt);

                // Si la canceló el paciente, avisar por correo al fisioterapeuta que el espacio
                // quedó libre
                if (isOwnPatient && !isAssignedPhysio && emailService != null) {
                        try {
                                emailService.sendAppointmentCancellationNotice(appt,
                                                authentication != null ? authentication.getName() : "Paciente");
                        } catch (Exception ex) {
                                System.err.println("Error no bloqueante enviando aviso de cancelación: "
                                                + ex.getMessage());
                        }
                }

                if (authentication != null && auditService != null) {
                        auditService.logAction(
                                        authentication.getName(),
                                        "CANCEL_APPOINTMENT",
                                        targetPatientId,
                                        "Canceló y liberó el horario de la cita #" + id + " programada para "
                                                        + apptDate);
                }
        }

        /**
         * Tarea programada diaria (09:00 AM) que envía recordatorios automáticos por
         * correo
         * a los pacientes cuya cita está programada exactamente para dentro de 2 días
         * (48 horas).
         */
        @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 9 * * *")
        @Transactional(readOnly = true)
        public void sendTwoDayAdvanceReminders() {
                LocalDate targetDate = LocalDate.now().plusDays(2);
                LocalDateTime startOfDay = targetDate.atStartOfDay();
                LocalDateTime endOfDay = targetDate.atTime(LocalTime.MAX);

                List<Appointment> upcomingAppointments = appointmentRepository
                                .findByAppointmentDateBetweenOrderByAppointmentDateAsc(startOfDay, endOfDay);

                for (Appointment appt : upcomingAppointments) {
                        if ("SCHEDULED".equalsIgnoreCase(appt.getStatus()) && emailService != null) {
                                try {
                                        emailService.sendAppointmentReminder(appt);
                                } catch (Exception ex) {
                                        System.err.println("Error enviando recordatorio 48h para cita #" + appt.getId()
                                                        + ": " + ex.getMessage());
                                }
                        }
                }
        }

        private void validateAppointmentOwnership(Appointment appt, Authentication authentication) {
                if (authentication == null) {
                        return;
                }
                boolean isAdminOrReception = authentication.getAuthorities().stream()
                                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                                                || a.getAuthority().equals("ROLE_RECEPCION"));
                boolean isAssignedPhysio = appt.getProfessional() != null
                                && appt.getProfessional().getUsername().equalsIgnoreCase(authentication.getName());

                if (!isAdminOrReception && !isAssignedPhysio) {
                        throw new org.springframework.security.access.AccessDeniedException(
                                        "No tienes permisos para modificar o cobrar una cita asignada a otro fisioterapeuta.");
                }
        }

        private String formatDisplayName(User user) {
                if (user == null)
                        return "";
                return (user.getFullName() != null && !user.getFullName().isBlank())
                                ? user.getFullName() + " (@" + user.getUsername() + ")"
                                : user.getUsername();
        }

        private AppointmentResponseDTO mapToDTO(Appointment appointment) {
                return AppointmentResponseDTO.builder()
                                .id(appointment.getId())
                                .patientId(appointment.getPatient().getId())
                                .patientName(formatDisplayName(appointment.getPatient()))
                                .professionalId(appointment.getProfessional().getId())
                                .professionalName(formatDisplayName(appointment.getProfessional()))
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
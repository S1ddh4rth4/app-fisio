package com.fisitec.appfisio.service;

import com.fisitec.appfisio.dto.AppointmentPaymentUpdateDTO;
import com.fisitec.appfisio.dto.AppointmentResponseDTO;
import com.fisitec.appfisio.dto.PatientPackageRequestDTO;
import com.fisitec.appfisio.dto.PatientPackageResponseDTO;
import com.fisitec.appfisio.entity.Appointment;
import com.fisitec.appfisio.entity.PatientPackage;
import com.fisitec.appfisio.entity.User;
import com.fisitec.appfisio.repository.AppointmentRepository;
import com.fisitec.appfisio.repository.PatientPackageRepository;
import com.fisitec.appfisio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PatientPackageRepository packageRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    /**
     * Vender / Registrar compra de un paquete para un paciente.
     */
    @Transactional
    public PatientPackageResponseDTO buyPackage(PatientPackageRequestDTO request) {
        User patient = userRepository.findById(request.getPatientIdentifier())
                .or(() -> userRepository.findByUsername(request.getPatientIdentifier()))
                .orElseThrow(() -> new IllegalArgumentException(
                        "Paciente no encontrado: " + request.getPatientIdentifier()));

        PatientPackage patientPackage = PatientPackage.builder()
                .patient(patient)
                .packageName(request.getPackageName())
                .totalSessions(request.getTotalSessions())
                .usedSessions(0)
                .totalPrice(request.getTotalPrice())
                .paymentMethod(request.getPaymentMethod())
                .status("ACTIVO")
                .build();

        PatientPackage saved = packageRepository.save(patientPackage);
        return mapToPackageDTO(saved);
    }

    /**
     * Obtener todos los paquetes de un paciente.
     */
    @Transactional(readOnly = true)
    public List<PatientPackageResponseDTO> getPackagesByPatient(String patientIdentifier) {
        // Permitimos buscar tanto por UUID como por nombre de usuario (username)
        User patient = userRepository.findById(patientIdentifier)
                .or(() -> userRepository.findByUsername(patientIdentifier))
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));

        return packageRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId()).stream()
                .map(this::mapToPackageDTO)
                .collect(Collectors.toList());
    }

    /**
     * Actualizar estado de pago de una cita (Individual o Descuento de Paquete).
     */
    @Transactional
    public AppointmentResponseDTO updateAppointmentPayment(Long appointmentId, AppointmentPaymentUpdateDTO updateDTO) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada con ID: " + appointmentId));

        if ("PAGADO".equalsIgnoreCase(appointment.getPaymentStatus())) {
            throw new IllegalStateException("Esta cita ya se encuentra registrada como pagada.");
        }

        appointment.setPaymentStatus(updateDTO.getPaymentStatus());
        appointment.setPaymentMethod(updateDTO.getPaymentMethod());
        appointment.setPaymentAmount(updateDTO.getAmount());

        // Si se paga con PAQUETE, validar propiedad y descontar sesión
        if ("PAQUETE".equalsIgnoreCase(updateDTO.getPaymentStatus())) {
            if (updateDTO.getPatientPackageId() == null || updateDTO.getPatientPackageId().isBlank()) {
                throw new IllegalArgumentException(
                        "Debe seleccionar un paquete válido para aplicar el descuento de sesión.");
            }

            PatientPackage pkg = packageRepository.findById(updateDTO.getPatientPackageId())
                    .orElseThrow(() -> new IllegalArgumentException("Paquete no encontrado"));

            if (pkg.getPatient() != null && appointment.getPatient() != null
                    && !pkg.getPatient().getId().equals(appointment.getPatient().getId())) {
                throw new IllegalArgumentException("El paquete seleccionado no pertenece al paciente de esta cita.");
            }

            if (!pkg.hasAvailableSessions()) {
                throw new IllegalStateException("El paquete seleccionado no tiene sesiones disponibles.");
            }

            pkg.consumeSession();
            packageRepository.save(pkg);
            appointment.setPatientPackage(pkg);
            // La consulta queda pagada y completada sin costo adicional hoy
            appointment.setPaymentStatus("PAGADO");
            appointment.setStatus("COMPLETED");
        }

        Appointment saved = appointmentRepository.save(appointment);
        return mapToAppointmentDTO(saved);
    }

    private PatientPackageResponseDTO mapToPackageDTO(PatientPackage p) {
        int remaining = Math.max(0, p.getTotalSessions() - p.getUsedSessions());
        return PatientPackageResponseDTO.builder()
                .id(p.getId())
                .patientId(p.getPatient().getId())
                .patientUsername(p.getPatient().getUsername())
                .packageName(p.getPackageName())
                .totalSessions(p.getTotalSessions())
                .usedSessions(p.getUsedSessions())
                .remainingSessions(remaining)
                .totalPrice(p.getTotalPrice())
                .paymentMethod(p.getPaymentMethod())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private AppointmentResponseDTO mapToAppointmentDTO(Appointment a) {
        return AppointmentResponseDTO.builder()
                .id(a.getId())
                .patientId(a.getPatient().getId())
                .patientName(a.getPatient().getUsername())
                .professionalId(a.getProfessional().getId())
                .professionalName(a.getProfessional().getUsername())
                .appointmentDate(a.getAppointmentDate())
                .reason(a.getReason())
                .status(a.getStatus())
                .appointmentType(a.getAppointmentType())
                .clinicalNotes(a.getClinicalNotes())
                .treatmentName(a.getTreatment() != null ? a.getTreatment().getName() : null)
                .paymentStatus(a.getPaymentStatus())
                .paymentAmount(a.getPaymentAmount())
                .paymentMethod(a.getPaymentMethod())
                .packageName(a.getPatientPackage() != null ? a.getPatientPackage().getPackageName() : null)
                .build();
    }
}
package com.fisitec.appfisio.service;

import com.fisitec.appfisio.dto.ClinicalHistoryRequestDTO;
import com.fisitec.appfisio.dto.ClinicalHistoryResponseDTO;
import com.fisitec.appfisio.entity.ClinicalHistory;
import com.fisitec.appfisio.entity.User;
import com.fisitec.appfisio.repository.AppointmentRepository;
import com.fisitec.appfisio.repository.ClinicalHistoryRepository;
import com.fisitec.appfisio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClinicalHistoryService {

        private final ClinicalHistoryRepository historyRepository;
        private final UserRepository userRepository;
        private final AppointmentRepository appointmentRepository;
        private final AuditService auditService;

        @Transactional
        public ClinicalHistoryResponseDTO saveOrUpdateHistory(ClinicalHistoryRequestDTO request,
                        String physioUsername) {
                User patient = userRepository.findById(request.getPatientId())
                                .or(() -> userRepository.findByUsername(request.getPatientId()))
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Paciente no encontrado: " + request.getPatientId()));

                User physio = userRepository.findByUsername(physioUsername)
                                .orElseThrow(() -> new IllegalArgumentException("Fisioterapeuta no encontrado"));

                ClinicalHistory history;

                if (request.getId() != null && !request.getId().isBlank()) {

                        // Modo Edición de evaluación existente
                        history = historyRepository.findById(request.getId())
                                        .orElseThrow(() -> new IllegalArgumentException(
                                                        "Historia clínica no encontrada con ID: " + request.getId()));

                        // ================= REGLAS DE PROTECCIÓN MÉDICA =================
                        // 1. Blindaje por Autoría: Permitir si es el mismo profesional o si el usuario
                        // tiene rol ADMIN
                        boolean isAuthor = history.getPhysiotherapist().getUsername().equalsIgnoreCase(physioUsername);
                        boolean isAdmin = physio.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));

                        if (!isAuthor && !isAdmin) {
                                throw new AccessDeniedException(
                                                "No tienes permisos para modificar la historia clínica firmada por otro profesional.");
                        }
                        // 2. Blindaje Temporal: Si pasaron más de 24 horas y no es ADMIN, no
                        // sobreescribir la histórica
                        if (!isAdmin && history.getCreatedAt() != null
                                        && history.getCreatedAt().isBefore(LocalDateTime.now().minusHours(24))) {
                                throw new IllegalStateException(
                                                "Esta historia clínica tiene más de 24 horas y está sellada de forma inmutable. Desmarca el ID para guardarla como Nueva Reevaluación.");
                        }

                } else {
                        // Modo Nueva Evaluación / Seguimiento
                        history = ClinicalHistory.builder()
                                        .patient(patient)
                                        .physiotherapist(physio)
                                        .recordNumber(request.getRecordNumber() != null
                                                        && !request.getRecordNumber().isBlank()
                                                                        ? request.getRecordNumber()
                                                                        : "EXP-" + patient.getUsername().toUpperCase())
                                        .build();
                }

                history.setEvaluationType(
                                request.getEvaluationType() != null ? request.getEvaluationType()
                                                : "VALORACION_INICIAL");
                history.setMainDiagnosis(request.getMainDiagnosis());
                history.setPainLevel(request.getPainLevel());
                history.setFormDataJson(request.getFormDataJson());

                ClinicalHistory saved = historyRepository.save(history);
                return mapToDTO(saved);
        }

        @Transactional(readOnly = true)
        public List<ClinicalHistoryResponseDTO> getHistoriesByPatient(String patientIdentifier, String currentUsername,
                        boolean isStaff) {
                User patient = userRepository.findById(patientIdentifier)
                                .or(() -> userRepository.findByUsername(patientIdentifier))
                                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));

                // Candado BOLA / IDOR: Si no es personal clínico, debe ser el propio paciente
                if (!isStaff && !patient.getUsername().equalsIgnoreCase(currentUsername)) {
                        throw new AccessDeniedException(
                                        "No tienes permisos para consultar el historial clínico de otro paciente.");
                }

                if (isStaff) {
                        validatePhysioPortfolioAccess(patient, currentUsername);
                }

                return historyRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId()).stream()
                                .map(this::mapToDTO)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public ClinicalHistoryResponseDTO getHistoryById(String id, String currentUsername, boolean isStaff) {
                ClinicalHistory history = historyRepository.findById(id)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Historia clínica no encontrada con ID: " + id));

                // Candado BOLA / IDOR: Si es paciente, solo puede consultar su propia historia
                // clínica
                if (!isStaff && !history.getPatient().getUsername().equalsIgnoreCase(currentUsername)) {
                        throw new AccessDeniedException("No tienes permisos para consultar esta historia clínica.");
                }

                if (isStaff) {
                        validatePhysioPortfolioAccess(history.getPatient(), currentUsername);
                }

                return mapToDTO(history);
        }

        /**
         * Garantiza que un fisioterapeuta solo consulte expedientes de pacientes de su
         * propia cartera,
         * mientras que el Administrador conserva acceso global de auditoría.
         */
        private void validatePhysioPortfolioAccess(User patient, String currentUsername) {
                User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
                if (currentUser == null || currentUser.getRoles() == null) {
                        return;
                }
                boolean isAdminOrReception = currentUser.getRoles().stream()
                                .anyMatch(r -> "ROLE_ADMIN".equals(r.getName())
                                                || "ROLE_RECEPCION".equals(r.getName()));
                if (isAdminOrReception) {
                        return;
                }

                boolean isPrimaryPhysio = patient.getPrimaryPhysio() != null
                                && patient.getPrimaryPhysio().getUsername().equalsIgnoreCase(currentUsername);
                boolean hasAppointmentsWithPhysio = appointmentRepository
                                .findDistinctProfessionalIdsByPatientId(patient.getId())
                                .contains(currentUser.getId());

                if (!isPrimaryPhysio && !hasAppointmentsWithPhysio) {
                        throw new AccessDeniedException(
                                        "No tienes permisos para consultar el historial clínico de un paciente asignado a otro fisioterapeuta.");
                }
        }

        @Transactional
        public void deleteHistory(String id, String currentUsername) {
                ClinicalHistory history = historyRepository.findById(id)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Historia clínica no encontrada con ID: " + id));

                User currentUser = userRepository.findByUsername(currentUsername)
                                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

                boolean isAdmin = currentUser.getRoles().stream()
                                .anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
                boolean isAuthor = history.getPhysiotherapist().getUsername().equalsIgnoreCase(currentUsername);

                if (!isAdmin && !isAuthor) {
                        throw new AccessDeniedException(
                                        "No tienes permisos para eliminar la historia clínica firmada por otro profesional.");
                }

                // Si es fisioterapeuta, solo se permite eliminar si fue creada dentro de las
                // últimas 24 horas
                // para permitir corregir duplicados accidentales del mismo día.
                if (!isAdmin && history.getCreatedAt() != null
                                && history.getCreatedAt().isBefore(LocalDateTime.now().minusHours(24))) {
                        throw new IllegalStateException(
                                        "Esta historia clínica tiene más de 24 horas y forma parte del archivo legal sellado. Solo un Administrador puede revocarla.");
                }

                String targetPatientId = history.getPatient() != null ? history.getPatient().getId() : "N/A";
                String recordNumber = history.getRecordNumber();

                historyRepository.delete(history);

                auditService.logAction(
                                currentUsername,
                                "DELETE_CLINICAL_HISTORY",
                                targetPatientId,
                                "Eliminó la evaluación clínica ID=" + id + " (Expediente: " + recordNumber + ")");
        }

        private ClinicalHistoryResponseDTO mapToDTO(ClinicalHistory h) {
                String patientDisplay = (h.getPatient().getFullName() != null
                                && !h.getPatient().getFullName().isBlank())
                                                ? h.getPatient().getFullName() + " (@" + h.getPatient().getUsername()
                                                                + ")"
                                                : h.getPatient().getUsername();
                String physioDisplay = (h.getPhysiotherapist().getFullName() != null
                                && !h.getPhysiotherapist().getFullName().isBlank())
                                                ? h.getPhysiotherapist().getFullName() + " (@"
                                                                + h.getPhysiotherapist().getUsername() + ")"
                                                : h.getPhysiotherapist().getUsername();

                return ClinicalHistoryResponseDTO.builder()
                                .id(h.getId())
                                .patientId(h.getPatient().getId())
                                .patientName(patientDisplay)
                                .physiotherapistId(h.getPhysiotherapist().getId())
                                .physiotherapistName(physioDisplay)
                                .recordNumber(h.getRecordNumber())
                                .evaluationType(h.getEvaluationType())
                                .mainDiagnosis(h.getMainDiagnosis())
                                .painLevel(h.getPainLevel())
                                .formDataJson(h.getFormDataJson())
                                .createdAt(h.getCreatedAt())
                                .updatedAt(h.getUpdatedAt())
                                .build();
        }
}
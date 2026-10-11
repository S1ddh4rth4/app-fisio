package com.fisitec.appfisio.service;

import com.fisitec.appfisio.dto.ClinicalHistoryRequestDTO;
import com.fisitec.appfisio.dto.ClinicalHistoryResponseDTO;
import com.fisitec.appfisio.entity.ClinicalHistory;
import com.fisitec.appfisio.entity.User;
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
                                        .recordNumber(request.getRecordNumber() != null
                                                        && !request.getRecordNumber().isBlank()
                                                                        ? request.getRecordNumber()
                                                                        : "EXP-" + patient.getUsername().toUpperCase())
                                        .build();
                }

                history.setPhysiotherapist(physio);
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
        public List<ClinicalHistoryResponseDTO> getHistoriesByPatient(String patientIdentifier) {
                User patient = userRepository.findById(patientIdentifier)
                                .or(() -> userRepository.findByUsername(patientIdentifier))
                                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));

                return historyRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId()).stream()
                                .map(this::mapToDTO)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public ClinicalHistoryResponseDTO getHistoryById(String id) {
                ClinicalHistory history = historyRepository.findById(id)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Historia clínica no encontrada con ID: " + id));
                return mapToDTO(history);
        }

        private ClinicalHistoryResponseDTO mapToDTO(ClinicalHistory h) {
                return ClinicalHistoryResponseDTO.builder()
                                .id(h.getId())
                                .patientId(h.getPatient().getId())
                                .patientName(h.getPatient().getUsername())
                                .physiotherapistId(h.getPhysiotherapist().getId())
                                .physiotherapistName(h.getPhysiotherapist().getUsername())
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
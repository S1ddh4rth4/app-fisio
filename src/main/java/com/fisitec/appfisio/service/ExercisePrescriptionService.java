package com.fisitec.appfisio.service;

import com.fisitec.appfisio.dto.PrescriptionItemDTO;
import com.fisitec.appfisio.dto.PrescriptionRequestDTO;
import com.fisitec.appfisio.dto.PrescriptionResponseDTO;
import com.fisitec.appfisio.entity.ExercisePrescription;
import com.fisitec.appfisio.entity.User;
import com.fisitec.appfisio.repository.ExercisePrescriptionRepository;
import com.fisitec.appfisio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExercisePrescriptionService {

        private final ExercisePrescriptionRepository prescriptionRepository;
        private final UserRepository userRepository;

        @Transactional
        public PrescriptionResponseDTO createPrescription(PrescriptionRequestDTO request,
                        String physiotherapistUsername) {
                User patient = findUserByIdOrUsername(request.getPatientIdentifier());
                User physiotherapist = userRepository.findByUsername(physiotherapistUsername)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Fisioterapeuta no encontrado: " + physiotherapistUsername));

                List<ExercisePrescription.PrescriptionItem> items = request.getItems().stream()
                                .map(itemDto -> ExercisePrescription.PrescriptionItem.builder()
                                                .exerciseName(itemDto.getExerciseName())
                                                .sets(itemDto.getSets())
                                                .repetitions(itemDto.getRepetitions())
                                                .frequency(itemDto.getFrequency())
                                                .notes(itemDto.getNotes())
                                                .videoUrl(itemDto.getVideoUrl())
                                                .build())
                                .collect(Collectors.toList());

                ExercisePrescription prescription = ExercisePrescription.builder()
                                .patient(patient)
                                .physiotherapist(physiotherapist)
                                .title(request.getTitle())
                                .generalInstructions(request.getGeneralInstructions())
                                .startDate(request.getStartDate())
                                .endDate(request.getEndDate())
                                .status("ACTIVA")
                                .items(items)
                                .build();

                ExercisePrescription saved = prescriptionRepository.save(prescription);
                return mapToDTO(saved);
        }

        // Aislamiento estricto de prescripciones por usuario autenticado
        @Transactional(readOnly = true)
        public List<PrescriptionResponseDTO> getPrescriptionsForCurrentUser(Authentication authentication) {
                String username = authentication.getName();
                boolean isAdmin = authentication.getAuthorities().stream()
                                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                boolean isFisio = authentication.getAuthorities().stream()
                                .anyMatch(a -> a.getAuthority().equals("ROLE_FISIOTERAPEUTA"));

                if (isAdmin) {
                        return prescriptionRepository.findAllByOrderByCreatedAtDesc()
                                        .stream()
                                        .map(this::mapToDTO)
                                        .collect(Collectors.toList());
                }

                if (isFisio) {
                        User physio = findUserByIdOrUsername(username);
                        return prescriptionRepository.findByPhysiotherapistIdOrderByCreatedAtDesc(physio.getId())
                                        .stream()
                                        .map(this::mapToDTO)
                                        .collect(Collectors.toList());
                }

                // Paciente
                User patient = findUserByIdOrUsername(username);
                return prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId())
                                .stream()
                                .map(this::mapToDTO)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<PrescriptionResponseDTO> getPatientPrescriptions(String patientIdentifier, String currentUsername,
                        boolean isStaff) {
                User patient = findUserByIdOrUsername(patientIdentifier);

                // Candado BOLA / IDOR: Si es paciente, solo puede consultar sus propias rutinas
                if (!isStaff && !patient.getUsername().equalsIgnoreCase(currentUsername)) {
                        throw new AccessDeniedException(
                                        "No tienes permisos para consultar las rutinas de otro paciente.");
                }

                return prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId())
                                .stream()
                                .map(this::mapToDTO)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public PrescriptionResponseDTO getPrescriptionById(String id, String currentUsername, boolean isStaff) {
                ExercisePrescription prescription = prescriptionRepository.findById(id)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Prescripción no encontrada con ID: " + id));

                // Candado BOLA / IDOR: Si es paciente, solo puede consultar su propia
                // prescripción
                if (!isStaff && !prescription.getPatient().getUsername().equalsIgnoreCase(currentUsername)) {
                        throw new AccessDeniedException(
                                        "No tienes permisos para consultar esta prescripción de ejercicios.");
                }

                return mapToDTO(prescription);
        }

        @Transactional
        public PrescriptionResponseDTO updatePrescriptionStatus(String id, String status) {
                ExercisePrescription prescription = prescriptionRepository.findById(id)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Prescripción no encontrada con ID: " + id));

                prescription.setStatus(status.toUpperCase());
                ExercisePrescription updated = prescriptionRepository.save(prescription);
                return mapToDTO(updated);
        }

        private User findUserByIdOrUsername(String identifier) {
                return userRepository.findById(identifier)
                                .or(() -> userRepository.findByUsername(identifier))
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Usuario no encontrado: " + identifier));
        }

        private PrescriptionResponseDTO mapToDTO(ExercisePrescription p) {
                List<PrescriptionItemDTO> itemsDto = p.getItems().stream()
                                .map(item -> PrescriptionItemDTO.builder()
                                                .exerciseName(item.getExerciseName())
                                                .sets(item.getSets())
                                                .repetitions(item.getRepetitions())
                                                .frequency(item.getFrequency())
                                                .notes(item.getNotes())
                                                .videoUrl(item.getVideoUrl())
                                                .build())
                                .collect(Collectors.toList());

                String patientDisplay = (p.getPatient().getFullName() != null
                                && !p.getPatient().getFullName().isBlank())
                                                ? p.getPatient().getFullName() + " (@" + p.getPatient().getUsername()
                                                                + ")"
                                                : p.getPatient().getUsername();
                String physioDisplay = (p.getPhysiotherapist().getFullName() != null
                                && !p.getPhysiotherapist().getFullName().isBlank())
                                                ? p.getPhysiotherapist().getFullName() + " (@"
                                                                + p.getPhysiotherapist().getUsername() + ")"
                                                : p.getPhysiotherapist().getUsername();

                return PrescriptionResponseDTO.builder()
                                .id(p.getId())
                                .patientId(p.getPatient().getId())
                                .patientName(patientDisplay)
                                .physiotherapistId(p.getPhysiotherapist().getId())
                                .physiotherapistName(physioDisplay)
                                .title(p.getTitle())
                                .generalInstructions(p.getGeneralInstructions())
                                .startDate(p.getStartDate())
                                .endDate(p.getEndDate())
                                .status(p.getStatus())
                                .items(itemsDto)
                                .createdAt(p.getCreatedAt())
                                .updatedAt(p.getUpdatedAt())
                                .build();
        }
}
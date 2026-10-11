package com.fisitec.appfisio.service;

import com.fisitec.appfisio.dto.TreatmentRequestDTO;
import com.fisitec.appfisio.dto.TreatmentResponseDTO;
import com.fisitec.appfisio.entity.Treatment;
import com.fisitec.appfisio.repository.TreatmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TreatmentService {

    private final TreatmentRepository treatmentRepository;

    /**
     * @Transactional asegura que si algo falla a la mitad,
     *                la base de datos deshaga los cambios (Rollback).
     */
    private final com.fisitec.appfisio.repository.UserRepository userRepository;

    @Transactional
    public TreatmentResponseDTO createTreatment(TreatmentRequestDTO request) {
        String currentUsername = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        com.fisitec.appfisio.entity.User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        if (currentUser != null && treatmentRepository.existsByNameAndPhysiotherapist(request.getName(), currentUser)) {
            throw new IllegalArgumentException(
                    "Ya tienes un tratamiento registrado con el nombre: " + request.getName());
        }

        Treatment treatment = Treatment.builder()
                .physiotherapist(currentUser)
                .name(request.getName())
                .description(request.getDescription())
                .durationMinutes(request.getDurationMinutes())
                .price(request.getPrice())
                .build();

        Treatment savedTreatment = treatmentRepository.save(treatment);
        return mapToDTO(savedTreatment);
    }

    /**
     * Obtiene el catálogo de tratamientos con aislamiento estricto por rol:
     * - Fisioterapeuta: únicamente sus propios tratamientos.
     * - Paciente: únicamente los tratamientos de su fisioterapeuta asignado.
     * - Administrador / Recepción: catálogo general de la clínica.
     */
    public List<TreatmentResponseDTO> getAllTreatments() {
        String currentUsername = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        com.fisitec.appfisio.entity.User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        if (currentUser == null) {
            return List.of();
        }

        boolean isFisio = currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_FISIOTERAPEUTA"));
        boolean isPatient = currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_PACIENTE"));

        List<Treatment> list;
        if (isFisio) {
            // Aislamiento: El fisioterapeuta solo ve su propio catálogo
            list = treatmentRepository.findByPhysiotherapist(currentUser);
        } else if (isPatient) {
            // Aislamiento: El paciente solo ve los tratamientos de su fisio de cabecera
            if (currentUser.getPrimaryPhysio() != null) {
                list = treatmentRepository.findByPhysiotherapist(currentUser.getPrimaryPhysio());
            } else {
                list = List.of();
            }
        } else {
            // Admin y Recepción supervisan toda la clínica
            list = treatmentRepository.findAll();
        }

        return list.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public TreatmentResponseDTO getTreatmentById(String id) {
        Treatment treatment = treatmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tratamiento no encontrado con ID: " + id));
        return mapToDTO(treatment);
    }

    /**
     * Actualizar los datos de un tratamiento existente.
     */
    @Transactional
    public TreatmentResponseDTO updateTreatment(String id, TreatmentRequestDTO request) {
        Treatment treatment = treatmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tratamiento no encontrado con ID: " + id));

        validateOwnership(treatment);

        // Si cambió el nombre, validar que no choque con otro existente del mismo fisio
        if (!treatment.getName().equalsIgnoreCase(request.getName())
                && treatmentRepository.existsByNameAndPhysiotherapist(request.getName(),
                        treatment.getPhysiotherapist())) {
            throw new IllegalArgumentException("Ya existe otro tratamiento con el nombre: " + request.getName());
        }

        treatment.setName(request.getName());
        treatment.setDescription(request.getDescription());
        treatment.setDurationMinutes(request.getDurationMinutes());
        treatment.setPrice(request.getPrice());

        Treatment updated = treatmentRepository.save(treatment);
        return mapToDTO(updated);
    }

    /**
     * Eliminar un tratamiento del catálogo por su ID.
     */
    @Transactional
    public void deleteTreatment(String id) {
        Treatment treatment = treatmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tratamiento no encontrado con ID: " + id));

        validateOwnership(treatment);

        treatmentRepository.delete(treatment);
    }

    /**
     * Valida que el usuario sea ADMIN o el fisioterapeuta dueño del tratamiento.
     */
    private void validateOwnership(Treatment treatment) {
        String currentUsername = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        com.fisitec.appfisio.entity.User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("Usuario no autenticado.");
        }

        boolean isAdmin = currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        if (isAdmin) {
            return; // El administrador puede editar y borrar cualquier tratamiento
        }

        // Si el tratamiento es global o pertenece a otro fisio, denegar permiso
        if (treatment.getPhysiotherapist() == null
                || !treatment.getPhysiotherapist().getId().equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "No tienes permisos para modificar o eliminar este tratamiento.");
        }
    }

    // Método de utilidad privado para no repetir código al mapear
    private TreatmentResponseDTO mapToDTO(Treatment treatment) {
        return TreatmentResponseDTO.builder()
                .id(treatment.getId())
                .name(treatment.getName())
                .description(treatment.getDescription())
                .durationMinutes(treatment.getDurationMinutes())
                .price(treatment.getPrice())
                .build();
    }
}
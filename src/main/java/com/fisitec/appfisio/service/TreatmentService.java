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
    @Transactional
    public TreatmentResponseDTO createTreatment(TreatmentRequestDTO request) {
        // Regla de Negocio: No permitir tratamientos con el mismo nombre
        if (treatmentRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Ya existe un tratamiento con el nombre: " + request.getName());
        }

        // Convertir el DTO (Mensajero) a la Entidad (Base de Datos)
        Treatment treatment = Treatment.builder()
                .name(request.getName())
                .description(request.getDescription())
                .durationMinutes(request.getDurationMinutes())
                .price(request.getPrice())
                .build();

        // Guardar
        Treatment savedTreatment = treatmentRepository.save(treatment);

        // Devolver la respuesta formateada
        return mapToDTO(savedTreatment);
    }

    public List<TreatmentResponseDTO> getAllTreatments() {
        return treatmentRepository.findAll().stream()
                .map(this::mapToDTO) // Convertimos cada Entidad a DTO
                .collect(Collectors.toList());
    }

    public TreatmentResponseDTO getTreatmentById(String id) {
        Treatment treatment = treatmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tratamiento no encontrado con ID: " + id));
        return mapToDTO(treatment);
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

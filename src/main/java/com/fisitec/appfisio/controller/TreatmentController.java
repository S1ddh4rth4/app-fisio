package com.fisitec.appfisio.controller;

import com.fisitec.appfisio.dto.TreatmentRequestDTO;
import com.fisitec.appfisio.dto.TreatmentResponseDTO;
import com.fisitec.appfisio.service.TreatmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/treatments")
@RequiredArgsConstructor
public class TreatmentController {

    private final TreatmentService treatmentService;

    // Solo los administradores pueden añadir nuevos tratamientos al catálogo
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TreatmentResponseDTO> createTreatment(@Valid @RequestBody TreatmentRequestDTO request) {
        TreatmentResponseDTO response = treatmentService.createTreatment(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Todos los roles autenticados pueden ver el catálogo de la clínica
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PACIENTE', 'FISIOTERAPEUTA')")
    public ResponseEntity<List<TreatmentResponseDTO>> getAllTreatments() {
        return ResponseEntity.ok(treatmentService.getAllTreatments());
    }

    // Ver un tratamiento específico por su ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PACIENTE', 'FISIOTERAPEUTA')")
    public ResponseEntity<TreatmentResponseDTO> getTreatmentById(@PathVariable String id) {
        return ResponseEntity.ok(treatmentService.getTreatmentById(id));
    }

    // Actualizar un tratamiento (Solo ADMIN)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TreatmentResponseDTO> updateTreatment(
            @PathVariable String id,
            @Valid @RequestBody TreatmentRequestDTO request) {
        return ResponseEntity.ok(treatmentService.updateTreatment(id, request));
    }

    // Eliminar un tratamiento (Solo ADMIN)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTreatment(@PathVariable String id) {
        treatmentService.deleteTreatment(id);
        return ResponseEntity.noContent().build();
    }
}
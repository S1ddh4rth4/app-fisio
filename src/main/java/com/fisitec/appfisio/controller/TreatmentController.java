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
        // Devolvemos HTTP 201 Created
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
}

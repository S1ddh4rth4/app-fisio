package com.fisitec.appfisio.controller;

import com.fisitec.appfisio.dto.CalendarBookRequestDTO;
import com.fisitec.appfisio.dto.CalendarSlotDTO;
import com.fisitec.appfisio.service.GoogleCalendarService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/calendar")
public class CalendarController {

    private final GoogleCalendarService googleCalendarService;

    // 🎓 ENDPOINT 1: Consultar disponibilidad (Conectado parcialmente a Google)
    @GetMapping("/slots")
    @PreAuthorize("hasAnyRole('ADMIN', 'PACIENTE', 'FISIOTERAPEUTA')")
    public ResponseEntity<List<CalendarSlotDTO>> getAvailableSlots(
            @RequestParam String professionalId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<CalendarSlotDTO> slots = googleCalendarService.getAvailableSlots(professionalId, date);
        return ResponseEntity.ok(slots);
    }

    // 🎓 ENDPOINT 2: Agendar la cita real en Google Calendar
    @PostMapping("/book")
    @PreAuthorize("hasAnyRole('ADMIN', 'PACIENTE')")
    public ResponseEntity<Map<String, String>> bookSlot(@Valid @RequestBody CalendarBookRequestDTO request) {
        try {
            // Mandamos llamar a nuestro servicio mágico
            String eventLink = googleCalendarService.bookSlot(request);

            // Si todo sale bien, devolvemos un 200 OK con el link del evento
            Map<String, String> response = new HashMap<>();
            response.put("message", "Cita agendada exitosamente en Google Calendar");
            response.put("googleCalendarLink", eventLink);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            // Si Google rechaza la petición o el JSON no se lee, atrapamos el error
            Map<String, String> error = new HashMap<>();
            error.put("error", "No se pudo agendar en Google Calendar: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}

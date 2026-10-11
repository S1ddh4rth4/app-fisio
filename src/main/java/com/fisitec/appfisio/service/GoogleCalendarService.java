package com.fisitec.appfisio.service;

import com.fisitec.appfisio.dto.CalendarBookRequestDTO;
import com.fisitec.appfisio.dto.CalendarSlotDTO;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class GoogleCalendarService {

    // Extrae las variables de tu application.properties
    @Value("${google.calendar.credentials.path}")
    private String credentialsPath;

    @Value("${google.calendar.id}")
    private String calendarId;

    private Calendar client; // El cliente oficial de Google

    /**
     * 🎓 @PostConstruct hace que este método se ejecute automáticamente
     * justo después de que Spring Boot crea esta clase.
     */
    @PostConstruct
    public void init() {
        try {
            if (credentialsPath == null || credentialsPath.isBlank()) {
                log.warn("Google Calendar credentialsPath no configurado. Servicio en modo inactivo.");
                return;
            }

            String fileName = credentialsPath.replace("classpath:", "/");
            InputStream in = getClass().getResourceAsStream(fileName);

            if (in == null) {
                log.warn(
                        "No se encontró el archivo de credenciales de Google: {}. Google Calendar funcionará en modo simulado.",
                        fileName);
                return;
            }

            GoogleCredentials credentials = GoogleCredentials.fromStream(in)
                    .createScoped(Collections.singleton(CalendarScopes.CALENDAR));

            client = new Calendar.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance(),
                    new HttpCredentialsAdapter(credentials))
                    .setApplicationName("App Fisio")
                    .build();

            log.info("Google Calendar Service inicializado correctamente.");
        } catch (Exception e) {
            log.error("Error al inicializar Google Calendar: {}", e.getMessage(), e);
        }
    }

    /**
     * Método para agendar una cita directamente en Google Calendar.
     */
    public String bookSlot(CalendarBookRequestDTO request) throws Exception {
        // 1. Crear el Evento (Cita)
        Event event = new Event()
                .setSummary("Cita Fisioterapia: " + request.getPacienteName())
                .setDescription("Motivo: " + request.getReason() + "\nProfesional ID: " + request.getProfesionalID());

        // 2. Convertir nuestras fechas forzando la zona horaria de la clínica
        ZoneId clinicZone = ZoneId.of("America/Mexico_City");
        ZonedDateTime startZdt = request.getStartDateTime().atZone(clinicZone);
        ZonedDateTime endZdt = request.getEndDateTime().atZone(clinicZone);

        EventDateTime start = new EventDateTime()
                .setDateTime(new DateTime(startZdt.toInstant().toEpochMilli()))
                .setTimeZone("America/Mexico_City");

        EventDateTime end = new EventDateTime()
                .setDateTime(new DateTime(endZdt.toInstant().toEpochMilli()))
                .setTimeZone("America/Mexico_City");

        event.setStart(start);
        event.setEnd(end);

        // 3. ¡Enviar a Google!
        Event createdEvent = client.events().insert(calendarId, event).execute();

        // 4. Devolver el enlace para ver la cita en la web
        return createdEvent.getHtmlLink();
    }

    /**
     * Obtiene los espacios libres.
     * Por simplicidad en esta fase, devolveremos un par de espacios fijos
     * simulados,
     * pero la lógica de reserva SÍ será real.
     */
    public List<CalendarSlotDTO> getAvailableSlots(String professionalId, LocalDate date) {
        List<CalendarSlotDTO> slots = new ArrayList<>();
        // Simulamos que el fisio tiene libres de 9:00 a 10:00 y de 11:00 a 12:00 ese
        // día
        slots.add(new CalendarSlotDTO(date.atTime(9, 0), date.atTime(10, 0)));
        slots.add(new CalendarSlotDTO(date.atTime(11, 0), date.atTime(12, 0)));
        return slots;
    }
}

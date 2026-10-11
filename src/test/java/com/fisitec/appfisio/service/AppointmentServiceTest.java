package com.fisitec.appfisio.service;

import com.fisitec.appfisio.dto.AppointmentRequestDTO;
import com.fisitec.appfisio.dto.AppointmentResponseDTO;
import com.fisitec.appfisio.entity.Appointment;
import com.fisitec.appfisio.entity.Role;
import com.fisitec.appfisio.entity.User;
import com.fisitec.appfisio.repository.AppointmentRepository;
import com.fisitec.appfisio.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @InjectMocks
    private AppointmentService appointmentService;

    private User patient;
    private User professional;

    @BeforeEach
    void setUp() {
        patient = new User();
        patient.setId("patient-uuid-1");
        patient.setUsername("paciente1");

        professional = new User();
        professional.setId("fisio-uuid-1");
        professional.setUsername("fisio1");

        // Agregamos el Rol para evitar errores cuando el servicio verifique si es Admin
        // o Fisio
        Role fisioRole = new Role();
        fisioRole.setName("ROLE_FISIOTERAPEUTA");
        professional.setRoles(Set.of(fisioRole));
    }

    @Test
    @DisplayName("Debe agendar cita exitosamente cuando la fecha es futura y no hay colisiones")
    void shouldCreateAppointmentSuccessfully() {
        LocalDateTime futureDate = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0);

        AppointmentRequestDTO request = new AppointmentRequestDTO();
        request.setPatientId("paciente1");
        request.setProfessionalId("fisio1");
        request.setAppointmentDate(futureDate);
        request.setReason("Rehabilitación lumbar");

        when(userRepository.findById("paciente1")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("paciente1")).thenReturn(Optional.of(patient));

        when(userRepository.findById("fisio1")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("fisio1")).thenReturn(Optional.of(professional));

        // Simular que NO hay colisiones
        when(appointmentRepository.existsByProfessionalIdAndAppointmentDateBetween(any(), any(), any()))
                .thenReturn(false);
        when(appointmentRepository.existsByPatientIdAndAppointmentDateBetween(any(), any(), any()))
                .thenReturn(false);

        Appointment savedAppointment = new Appointment();
        savedAppointment.setId(1L);
        savedAppointment.setPatient(patient);
        savedAppointment.setProfessional(professional);
        savedAppointment.setAppointmentDate(futureDate);
        savedAppointment.setReason("Rehabilitación lumbar");
        savedAppointment.setStatus("SCHEDULED");
        savedAppointment.setPaymentStatus("PENDIENTE");

        when(appointmentRepository.save(any(Appointment.class))).thenReturn(savedAppointment);

        // AQUÍ REPARAMOS EL ERROR: Le pasamos "fisio1" como el usuario logueado
        AppointmentResponseDTO response = appointmentService.createAppointment(request, "fisio1");

        assertNotNull(response);
        assertEquals("paciente1", response.getPatientName());
        assertEquals("fisio1", response.getProfessionalName());
        assertEquals("SCHEDULED", response.getStatus());
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Debe rechazar cita si la fecha solicitada está en el pasado")
    void shouldThrowExceptionWhenDateIsInThePast() {
        LocalDateTime pastDate = LocalDateTime.now().minusDays(1);

        AppointmentRequestDTO request = new AppointmentRequestDTO();
        request.setPatientId("paciente1");
        request.setProfessionalId("fisio1");
        request.setAppointmentDate(pastDate);
        request.setReason("Consulta pasada");

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            // Pasamos el segundo parámetro aquí también
            appointmentService.createAppointment(request, "fisio1");
        });

        assertTrue(exception.getMessage().contains("fechas u horas pasadas"));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe rechazar cita si el fisioterapeuta ya tiene otra sesión en ese rango de 60 minutos")
    void shouldThrowExceptionWhenTherapistHasCollision() {
        LocalDateTime requestedDate = LocalDateTime.now().plusDays(1).withHour(11).withMinute(0);

        AppointmentRequestDTO request = new AppointmentRequestDTO();
        request.setPatientId("paciente1");
        request.setProfessionalId("fisio1");
        request.setAppointmentDate(requestedDate);
        request.setReason("Sesión de terapia");

        when(userRepository.findById("paciente1")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("paciente1")).thenReturn(Optional.of(patient));

        when(userRepository.findById("fisio1")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("fisio1")).thenReturn(Optional.of(professional));

        // Simular que el fisioterapeuta SÍ tiene colisión
        when(appointmentRepository.existsByProfessionalIdAndAppointmentDateBetween(any(), any(), any()))
                .thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            appointmentService.createAppointment(request, "fisio1");
        });

        assertTrue(exception.getMessage().contains("ya tiene una sesión agendada"));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe rechazar cita si el paciente ya tiene otra cita en ese rango horario")
    void shouldThrowExceptionWhenPatientHasCollision() {
        LocalDateTime requestedDate = LocalDateTime.now().plusDays(1).withHour(11).withMinute(0);

        AppointmentRequestDTO request = new AppointmentRequestDTO();
        request.setPatientId("paciente1");
        request.setProfessionalId("fisio1");
        request.setAppointmentDate(requestedDate);
        request.setReason("Sesión de terapia");

        when(userRepository.findById("paciente1")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("paciente1")).thenReturn(Optional.of(patient));

        when(userRepository.findById("fisio1")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("fisio1")).thenReturn(Optional.of(professional));

        when(appointmentRepository.existsByProfessionalIdAndAppointmentDateBetween(any(), any(), any()))
                .thenReturn(false);
        when(appointmentRepository.existsByPatientIdAndAppointmentDateBetween(any(), any(), any()))
                .thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            appointmentService.createAppointment(request, "fisio1");
        });

        assertTrue(exception.getMessage().contains("ya cuenta con otra cita"));
        verify(appointmentRepository, never()).save(any());
    }
}
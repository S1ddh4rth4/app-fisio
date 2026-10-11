package com.fisitec.appfisio.service;

import com.fisitec.appfisio.dto.AppointmentPaymentUpdateDTO;
import com.fisitec.appfisio.dto.AppointmentResponseDTO;
import com.fisitec.appfisio.dto.PatientPackageRequestDTO;
import com.fisitec.appfisio.dto.PatientPackageResponseDTO;
import com.fisitec.appfisio.entity.Appointment;
import com.fisitec.appfisio.entity.PatientPackage;
import com.fisitec.appfisio.entity.User;
import com.fisitec.appfisio.repository.AppointmentRepository;
import com.fisitec.appfisio.repository.PatientPackageRepository;
import com.fisitec.appfisio.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PatientPackageRepository packageRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PaymentService paymentService;

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
    }

    @Test
    @DisplayName("Debe registrar la venta de un paquete de 10 sesiones exitosamente")
    void shouldBuyPackageSuccessfully() {
        PatientPackageRequestDTO request = new PatientPackageRequestDTO();
        request.setPatientIdentifier("paciente1");
        request.setPackageName("Bono Fisioterapia (10 Sesiones)");
        request.setTotalSessions(10);
        request.setTotalPrice(new BigDecimal("3500.00"));
        request.setPaymentMethod("TRANSFERENCIA");

        when(userRepository.findById("paciente1")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("paciente1")).thenReturn(Optional.of(patient));

        PatientPackage savedPackage = PatientPackage.builder()
                .id("pkg-uuid-1")
                .patient(patient)
                .packageName(request.getPackageName())
                .totalSessions(10)
                .usedSessions(0)
                .totalPrice(request.getTotalPrice())
                .paymentMethod("TRANSFERENCIA")
                .status("ACTIVO")
                .build();

        when(packageRepository.save(any(PatientPackage.class))).thenReturn(savedPackage);

        PatientPackageResponseDTO response = paymentService.buyPackage(request);

        assertNotNull(response);
        assertEquals(10, response.getTotalSessions());
        assertEquals(10, response.getRemainingSessions());
        assertEquals("ACTIVO", response.getStatus());
        verify(packageRepository, times(1)).save(any(PatientPackage.class));
    }

    @Test
    @DisplayName("Debe descontar 1 sesión del paquete al cobrar una cita (utilizadas pasa de 0 a 1)")
    void shouldDeductSessionFromPackageWhenPayingAppointment() {
        PatientPackage pkg = PatientPackage.builder()
                .id("pkg-uuid-1")
                .patient(patient)
                .packageName("Bono 10 Sesiones")
                .totalSessions(10)
                .usedSessions(0)
                .status("ACTIVO")
                .build();

        Appointment appointment = new Appointment();
        appointment.setId(1L);
        appointment.setPatient(patient);
        appointment.setProfessional(professional);
        appointment.setAppointmentDate(LocalDateTime.now().plusDays(1));
        appointment.setReason("Sesión 1");
        appointment.setStatus("SCHEDULED");
        appointment.setPaymentStatus("PENDIENTE");

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(packageRepository.findById("pkg-uuid-1")).thenReturn(Optional.of(pkg));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArguments()[0]);

        AppointmentPaymentUpdateDTO paymentUpdate = new AppointmentPaymentUpdateDTO();
        paymentUpdate.setPaymentStatus("PAQUETE");
        paymentUpdate.setPatientPackageId("pkg-uuid-1");

        AppointmentResponseDTO response = paymentService.updateAppointmentPayment(1L, paymentUpdate);

        assertNotNull(response);
        assertEquals("PAQUETE", response.getPaymentStatus());
        assertEquals(1, pkg.getUsedSessions()); // Se utilizó 1 sesión
        verify(packageRepository, times(1)).save(pkg);
    }
}
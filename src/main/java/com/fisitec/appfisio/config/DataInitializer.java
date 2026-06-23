package com.fisitec.appfisio.config;

import com.fisitec.appfisio.entity.Appointment;
import com.fisitec.appfisio.entity.Role;
import com.fisitec.appfisio.entity.User;
import com.fisitec.appfisio.repository.AppointmentRepository;
import com.fisitec.appfisio.repository.RoleRepository;
import com.fisitec.appfisio.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

/**
 * Data initializer to seed default roles, admin user, and dummy data on application startup.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserService userService;
    private final AppointmentRepository appointmentRepository;

    /**
     * Run initialization logic.
     * @param args command line arguments
     */
    @Override
    public void run(String... args) {
        // Create default roles si no existen
        createRoleIfNotExists("ROLE_ADMIN");
        createRoleIfNotExists("ROLE_FISIOTERAPEUTA");
        createRoleIfNotExists("ROLE_PACIENTE");

        // Create default admin
        if (!userService.existsByUsername("admin")) {
            userService.createUser("admin", "admin@appfisio.com", "admin123", "ROLE_ADMIN");
        }

        // Crear MÚLTIPLES Fisioterapeutas
        User fisio1 = getOrCreateUser("fisio1", "fisio1@appfisio.com", "fisio123", "ROLE_FISIOTERAPEUTA");
        User fisio2 = getOrCreateUser("fisio2", "fisio2@appfisio.com", "fisio123", "ROLE_FISIOTERAPEUTA");
        List<User> fisios = Arrays.asList(fisio1, fisio2);

        // Crear MÚLTIPLES Pacientes
        User paciente1 = getOrCreateUser("paciente1", "paciente1@appfisio.com", "paciente123", "ROLE_PACIENTE");
        User paciente2 = getOrCreateUser("paciente2", "paciente2@appfisio.com", "paciente123", "ROLE_PACIENTE");
        User paciente3 = getOrCreateUser("paciente3", "paciente3@appfisio.com", "paciente123", "ROLE_PACIENTE");
        List<User> pacientes = Arrays.asList(paciente1, paciente2, paciente3);

        // Generar historial de citas si está vacío
        if (appointmentRepository.count() == 0) {
            System.out.println("Generando historial de citas de prueba (3 meses) para múltiples usuarios...");
            Random random = new Random();
            
            // Citas pasadas (últimos 90 días, una cada 2 días para tener MÁS volumen)
            for (int i = 90; i > 0; i -= 2) {
                // Elegir un paciente y un fisio al azar para cada cita
                User randomFisio = fisios.get(random.nextInt(fisios.size()));
                User randomPaciente = pacientes.get(random.nextInt(pacientes.size()));

                Appointment appt = new Appointment();
                appt.setPatient(randomPaciente);
                appt.setProfessional(randomFisio);
                // Hora aleatoria entre las 8 am y las 5 pm (17:00)
                appt.setAppointmentDate(LocalDateTime.now().minusDays(i).withHour(8 + random.nextInt(10)).withMinute(0));
                appt.setReason("Rehabilitación sesión de rutina");
                appt.setStatus("COMPLETED");
                appointmentRepository.save(appt);
            }

            // Citas de HOY distribuidas entre los diferentes usuarios
            crearCitaHoy(paciente1, fisio1, 9, 30, "Dolor de espalda - Urgente", "PENDING");
            crearCitaHoy(paciente2, fisio2, 11, 0, "Revisión de rodilla", "PENDING");
            crearCitaHoy(paciente3, fisio1, 16, 0, "Terapia post-operatoria", "PENDING");
            crearCitaHoy(paciente1, fisio2, 18, 0, "Masaje descontracturante", "PENDING");
            
            System.out.println("¡Historial de citas dinámico generado con éxito!");
        }
    }

    /**
     * Helper method to get an existing user or create it.
     */
    private User getOrCreateUser(String username, String email, String password, String role) {
        if (!userService.existsByUsername(username)) {
            return userService.createUser(username, email, password, role);
        }
        return userService.findByUsername(username).orElseThrow();
    }

    /**
     * Helper method to create appointments for today easily.
     */
    private void crearCitaHoy(User paciente, User fisio, int hora, int minuto, String razon, String estado) {
        Appointment appt = new Appointment();
        appt.setPatient(paciente);
        appt.setProfessional(fisio);
        appt.setAppointmentDate(LocalDateTime.now().withHour(hora).withMinute(minuto));
        appt.setReason(razon);
        appt.setStatus(estado);
        appointmentRepository.save(appt);
    }

    /**
     * Create a role if it doesn't already exist.
     */
    private void createRoleIfNotExists(String roleName) {
        if (roleRepository.findByName(roleName).isEmpty()) {
            Role role = new Role();
            role.setName(roleName);
            roleRepository.save(role);
        }
    }
}
package com.fisitec.appfisio.service;

import com.fisitec.appfisio.dto.PatientRegisterRequestDTO;
import com.fisitec.appfisio.dto.UserDTO;
import com.fisitec.appfisio.entity.User;
import com.fisitec.appfisio.repository.AppointmentRepository;
import com.fisitec.appfisio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio encargado de la gestión de pacientes y aislamiento de directorio.
 * Garantiza que cada fisioterapeuta solo gestione a sus pacientes asignados.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PatientService {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserService userService;
    private final EmailService emailService;

    /**
     * Obtiene el listado de pacientes con aislamiento estricto por rol:
     * - Administrador / Recepción: Todos los pacientes de la clínica.
     * - Fisioterapeuta: Únicamente los pacientes con citas agendadas o en su
     * cartera.
     */
    @Transactional(readOnly = true)
    public List<UserDTO> getPatientsForUser(String username, boolean isStaffAdmin) {
        if (isStaffAdmin) {
            return userRepository.findByRoles_Name("ROLE_PACIENTE").stream()
                    .map(userService::convertToDTO)
                    .collect(Collectors.toList());
        }

        // Fisioterapeuta: Cartera exclusiva de pacientes
        User physio = userRepository.findByUsername(username).orElse(null);
        if (physio == null) {
            return List.of();
        }

        // Obtenemos los pacientes con los que ya ha tenido citas
        List<String> patientIds = new java.util.ArrayList<>(
                appointmentRepository.findDistinctPatientIdsByProfessionalId(physio.getId()));

        // Agregamos también a los pacientes recién registrados en su cartera
        userRepository.findByPrimaryPhysio(physio).forEach(p -> {
            if (!patientIds.contains(p.getId())) {
                patientIds.add(p.getId());
            }
        });

        return userRepository.findAllById(patientIds).stream()
                .map(userService::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Quick clinical registration of a new patient by clinic staff.
     */
    @Transactional
    public com.fisitec.appfisio.dto.PatientRegistrationResponseDTO registerPatient(PatientRegisterRequestDTO request,
            String currentUsername) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Ya existe un paciente registrado con el correo: " + request.getEmail());
        }

        // Buscar al usuario que está registrando al paciente
        User creator = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("Usuario creador no encontrado"));

        boolean isCreatorFisio = creator.getRoles() != null && creator.getRoles().stream()
                .anyMatch(r -> "ROLE_FISIOTERAPEUTA".equals(r.getName()));

        User assignedPhysio = creator;
        if (!isCreatorFisio && request.getAssignedPhysioUsername() != null
                && !request.getAssignedPhysioUsername().isBlank()) {
            assignedPhysio = userRepository.findByUsername(request.getAssignedPhysioUsername().trim())
                    .orElse(creator);
        }

        String generatedUsername = userService.generateUniqueUsername(request.getFullName());
        // Generamos una clave segura aleatoria tipo "App-9a8b2"
        String randomSuffix = java.util.UUID.randomUUID().toString().substring(0, 5);
        String initialPassword = "App-" + randomSuffix;

        // Crear al paciente
        User newPatient = userService.createUser(generatedUsername, request.getEmail(), initialPassword,
                "ROLE_PACIENTE");

        // Guardar nombre completo del paciente y asignarlo a la cartera de su Fisio
        newPatient.setFullName(request.getFullName());
        newPatient.setPrimaryPhysio(assignedPhysio);

        // Obligar a cambiar la contraseña temporal al ingresar
        newPatient.setMustChangePassword(true);

        // Cumplimiento Legal: Rastro de auditoría de privacidad
        if (Boolean.TRUE.equals(request.getAcceptsPrivacyPolicy())) {
            newPatient.setPrivacyPolicyAcceptedAt(java.time.LocalDateTime.now());
        }

        userRepository.save(newPatient);

        // Enviar correo de bienvenida asíncrono con usuario y clave temporal
        emailService.sendWelcomeCredentials(
                newPatient.getEmail(),
                newPatient.getFullName(),
                newPatient.getUsername(),
                initialPassword,
                "ROLE_PACIENTE");

        log.info("Alta rápida de paciente {} asignado a {}", request.getEmail(), assignedPhysio.getUsername());

        // Devolver la respuesta con la contraseña en texto plano para copiar al
        // WhatsApp
        return com.fisitec.appfisio.dto.PatientRegistrationResponseDTO.builder()
                .id(newPatient.getId())
                .username(newPatient.getUsername())
                .fullName(newPatient.getFullName())
                .email(newPatient.getEmail())
                .temporaryPassword(initialPassword)
                .primaryPhysioName(assignedPhysio.getFullName() != null && !assignedPhysio.getFullName().isBlank()
                        ? assignedPhysio.getFullName()
                        : assignedPhysio.getUsername())
                .build();
    }
}
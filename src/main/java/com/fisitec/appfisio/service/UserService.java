package com.fisitec.appfisio.service;

import com.fisitec.appfisio.dto.UserDTO;
import com.fisitec.appfisio.entity.Role;
import com.fisitec.appfisio.entity.User;
import com.fisitec.appfisio.repository.RoleRepository;
import com.fisitec.appfisio.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Lazy;

/**
 * Servicio encargado de la administración integral de usuarios, perfiles y
 * credenciales.
 */

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final com.fisitec.appfisio.repository.AppointmentRepository appointmentRepository;
    private final com.fisitec.appfisio.repository.ClinicalHistoryRepository clinicalHistoryRepository;
    private final com.fisitec.appfisio.repository.ExercisePrescriptionRepository prescriptionRepository;
    private final com.fisitec.appfisio.repository.PatientPackageRepository patientPackageRepository;
    private final AuditService auditService;
    private final MfaService mfaService;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
            RoleRepository roleRepository,
            com.fisitec.appfisio.repository.AppointmentRepository appointmentRepository,
            com.fisitec.appfisio.repository.ClinicalHistoryRepository clinicalHistoryRepository,
            com.fisitec.appfisio.repository.ExercisePrescriptionRepository prescriptionRepository,
            com.fisitec.appfisio.repository.PatientPackageRepository patientPackageRepository,
            AuditService auditService,
            MfaService mfaService,
            @Lazy BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.appointmentRepository = appointmentRepository;
        this.clinicalHistoryRepository = clinicalHistoryRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.patientPackageRepository = patientPackageRepository;
        this.auditService = auditService;
        this.mfaService = mfaService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Find a user by username.
     * 
     * @param username the username
     * @return Optional containing the user if found
     */
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public void updateUser(User user) {
        userRepository.save(user);
    }

    /**
     * Find a user by email.
     * 
     * @param email the email
     * @return Optional containing the user if found
     */
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Check if a username exists.
     * 
     * @param username the username
     * @return true if exists, false otherwise
     */
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    /**
     * Check if an email exists.
     * 
     * @param email the email
     * @return true if exists, false otherwise
     */
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    /**
     * Save a user to the database.
     * 
     * @param user the user to save
     * @return the saved user
     */
    public User saveUser(User user) {
        // Encode password if it's not already encoded
        if (user.getPassword() != null && !user.getPassword().startsWith("$2a$")) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return userRepository.save(user);
    }

    /**
     * Create a new user with default role.
     * 
     * @param username        the username
     * @param email           the email
     * @param password        the raw password
     * @param defaultRoleName the default role name (e.g., "ROLE_PACIENTE")
     * @return the created user
     */
    public User createUser(String username, String email, String password, String defaultRoleName) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(password); // Will be encoded in saveUser
        user.setEnabled(true);
        user.setMustChangePassword(true); // Exigir cambio de contraseña en su primer inicio de sesión

        // Assign default role
        Role defaultRole = roleRepository.findByName(defaultRoleName)
                .orElseThrow(() -> new RuntimeException("Default role not found: " + defaultRoleName));

        // BUG FIX: Hibernate requiere colecciones mutables (HashSet)
        java.util.Set<Role> mutableRoles = new java.util.HashSet<>();
        mutableRoles.add(defaultRole);
        user.setRoles(mutableRoles);

        return saveUser(user);
    }

    /**
     * Assign a role to a user.
     * 
     * @param user     the user
     * @param roleName the role name
     */
    public void assignRole(User user, String roleName) {
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
        user.getRoles().add(role);
        userRepository.save(user);
    }

    /**
     * Encode a password using BCrypt.
     * 
     * @param password the raw password
     * @return the encoded password
     */
    public String encodePassword(String password) {
        return passwordEncoder.encode(password);
    }

    /**
     * Verify if a raw password matches the encoded password.
     * 
     * @param rawPassword     the raw password
     * @param encodedPassword the encoded password
     * @return true if matches, false otherwise
     */
    public boolean matchesPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    /**
     * Convierte una entidad User a su DTO de respuesta seguro para el frontend.
     * Incluye datos personales y profesionales para cualquier rol del sistema.
     */
    public UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setPhone(user.getPhone());
        dto.setProfessionalLicense(user.getProfessionalLicense());
        dto.setAvatarUrl(user.getAvatarUrl());
        if (user.getPrimaryPhysio() != null) {
            User physio = user.getPrimaryPhysio();
            dto.setPrimaryPhysioId(physio.getId());
            dto.setPrimaryPhysioUsername(physio.getUsername());
            dto.setPrimaryPhysioName(physio.getFullName() != null && !physio.getFullName().isBlank()
                    ? physio.getFullName() + " (@" + physio.getUsername() + ")"
                    : "@" + physio.getUsername());
        }
        dto.setRoles(user.getRoles() != null
                ? user.getRoles().stream().map(role -> role.getName()).collect(Collectors.toSet())
                : java.util.Collections.emptySet());
        dto.setEnabled(user.getEnabled());
        dto.setMfaEnabled(Boolean.TRUE.equals(user.getMfaEnabled()));
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }

    /**
     * Actualiza la información del perfil del usuario autenticado.
     * Aplica para cualquier rol: Administrador, Fisioterapeuta, Paciente,
     * Recepción.
     */
    @org.springframework.transaction.annotation.Transactional
    public UserDTO updateProfile(String username, com.fisitec.appfisio.dto.UserProfileUpdateDTO request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + username));

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }
        if (request.getProfessionalLicense() != null) {
            user.setProfessionalLicense(request.getProfessionalLicense().trim());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        User updatedUser = userRepository.save(user);
        auditService.logAction(username, "ACTUALIZAR_PERFIL", user.getId(), "Perfil personal actualizado.");
        return convertToDTO(updatedUser);
    }

    /**
     * Permite a un usuario cambiar su contraseña tras validar su contraseña actual.
     */
    public User changePassword(String username, String currentPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("La contraseña actual es incorrecta");
        }

        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new IllegalArgumentException("La nueva contraseña no puede ser igual a la contraseña actual");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        if (user.getPrivacyPolicyAcceptedAt() == null) {
            user.setPrivacyPolicyAcceptedAt(java.time.LocalDateTime.now());
        }
        // Revocación inmediata: incrementamos la versión para expulsar sesiones en
        // otros dispositivos
        user.setTokenVersion(user.getTokenVersion() != null ? user.getTokenVersion() + 1 : 1);
        return userRepository.save(user);
    }

    /**
     * Paso 1 de 2FA: Genera un secreto TOTP y devuelve el código QR sin activar aún
     * el bloqueo.
     */
    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, String> setupMfa(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        String secret = mfaService.generateSecret();
        user.setMfaSecret(secret);
        userRepository.save(user);

        String qrCodeImage = mfaService.getQrCodeImageBase64(secret, username);
        return java.util.Map.of(
                "secret", secret,
                "qrCodeImage", qrCodeImage);
    }

    /**
     * Paso 2 de 2FA: Verifica el código de 6 dígitos del autenticador (Google /
     * Apple) y activa el 2FA.
     */
    @org.springframework.transaction.annotation.Transactional
    public void verifyAndEnableMfa(String username, String code) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (user.getMfaSecret() == null || user.getMfaSecret().isBlank()) {
            throw new IllegalStateException("Primero debes generar el código QR de configuración.");
        }

        if (code == null || !mfaService.verifyCode(user.getMfaSecret(), code.trim())) {
            throw new IllegalArgumentException(
                    "El código de 6 dígitos es incorrecto. Verifica la hora de tu dispositivo e intenta de nuevo.");
        }

        user.setMfaEnabled(true);
        userRepository.save(user);
        auditService.logAction(username, "ACTIVAR_2FA", user.getId(), "Autenticación en dos pasos (2FA) activada.");
    }

    /**
     * Desactiva la verificación en dos pasos (2FA) de la cuenta actual.
     */
    @org.springframework.transaction.annotation.Transactional
    public void disableMfa(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        userRepository.save(user);
        auditService.logAction(username, "DESACTIVAR_2FA", user.getId(),
                "Autenticación en dos pasos (2FA) desactivada.");
    }

    /**
     * Genera un username clínico secuencial limpio (ej. "Laura López" -> "llopez",
     * luego "llopez1", "llopez2")
     */
    public String generateUniqueUsername(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return "paciente" + System.currentTimeMillis();
        }

        // 1. Quitar acentos y caracteres especiales
        String clean = java.text.Normalizer.normalize(fullName.trim().toLowerCase(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replaceAll("[^a-z0-9\\s]", "");

        String[] parts = clean.split("\\s+");
        String base;
        if (parts.length == 1) {
            base = parts[0];
        } else {
            // Primera letra del nombre + último apellido
            base = parts[0].substring(0, 1) + parts[parts.length - 1];
        }

        // Si la base no existe, es el primer paciente con ese nombre
        if (!userRepository.existsByUsername(base)) {
            return base;
        }

        // Si ya existe, buscar secuencialmente llopez1, llopez2, llopez3...
        int counter = 1;
        while (userRepository.existsByUsername(base + counter)) {
            counter++;
        }
        return base + counter;
    }

    /**
     * Borrado Inteligente / Derecho al Olvido:
     * - Si el paciente fue creado por error (0 citas, 0 historias, 0 rutinas y 0
     * paquetes),
     * lo elimina definitivamente de la base de datos liberando su correo y usuario.
     * - Si ya cuenta con historial clínico o citas, anonimiza sus datos personales
     * (NOM-004).
     */
    @org.springframework.transaction.annotation.Transactional
    public String deleteAndAnonymizePatient(String patientId, String adminUsername) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado en el sistema."));

        boolean isPatient = patient.getRoles().stream()
                .anyMatch(role -> role.getName().equals("ROLE_PACIENTE"));

        if (!isPatient) {
            throw new IllegalArgumentException("¡Alto! Este usuario pertenece al personal clínico.");
        }

        boolean hasAppointments = !appointmentRepository.findByPatientId(patientId).isEmpty();
        boolean hasHistories = !clinicalHistoryRepository.findByPatientIdOrderByCreatedAtDesc(patientId).isEmpty();
        boolean hasPrescriptions = !prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId).isEmpty();
        boolean hasPackages = !patientPackageRepository.findByPatientIdOrderByCreatedAtDesc(patientId).isEmpty();

        if (!hasAppointments && !hasHistories && !hasPrescriptions && !hasPackages) {
            String deletedUsername = patient.getUsername();
            String deletedEmail = patient.getEmail();
            userRepository.delete(patient);
            auditService.logAction(adminUsername, "DELETE_PATIENT_MISTAKE", patientId,
                    "Paciente @" + deletedUsername + " (" + deletedEmail
                            + ") eliminado definitivamente por carecer de historial clínico o citas.");
            return "El paciente no tenía citas ni historial clínico, por lo que fue eliminado definitivamente y su correo quedó libre.";
        }

        String randomSuffix = java.util.UUID.randomUUID().toString().substring(0, 8);
        patient.setFullName("Paciente Anonimizado");
        patient.setPhone(null);
        patient.setPrimaryPhysio(null);
        patient.setUsername("borrado_" + randomSuffix);
        patient.setEmail("anon_" + randomSuffix + "@borrado.com");
        patient.setPassword("CUENTA_DESTRUIDA_IRREVERSIBLE");
        patient.setEnabled(false);
        patient.setTokenVersion((patient.getTokenVersion() == null ? 0 : patient.getTokenVersion()) + 1);

        userRepository.save(patient);

        auditService.logAction(adminUsername, "ANONYMIZE_PATIENT", patientId,
                "El paciente exigió su Derecho al Olvido. Datos PII destruidos conservando integridad contable/clínica.");
        return "El paciente ya contaba con historial o citas, por lo que fue anonimizado (Derecho al Olvido) y ocultado del directorio activo.";
    }

    /**
     * Suspende o reactiva la cuenta de un miembro del personal clínico (Solo
     * Admin).
     */
    @org.springframework.transaction.annotation.Transactional
    public UserDTO toggleStaffStatus(String userId, String adminUsername) {
        User staffUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario del personal no encontrado."));

        if (staffUser.getUsername().equalsIgnoreCase(adminUsername)) {
            throw new IllegalArgumentException("Por seguridad, no puedes suspender tu propia cuenta de Administrador.");
        }

        boolean newStatus = !Boolean.TRUE.equals(staffUser.getEnabled());
        staffUser.setEnabled(newStatus);
        staffUser.setTokenVersion((staffUser.getTokenVersion() == null ? 0 : staffUser.getTokenVersion()) + 1);
        User saved = userRepository.save(staffUser);

        auditService.logAction(adminUsername, newStatus ? "REACTIVATE_STAFF" : "SUSPEND_STAFF", userId,
                "Cuenta del personal @" + staffUser.getUsername()
                        + (newStatus ? " reactivada." : " suspendida y sesiones cerradas."));

        return convertToDTO(saved);
    }

    /**
     * Elimina definitivamente a un miembro del personal si fue creado por error
     * y aún no tiene pacientes, citas ni historias clínicas asociadas.
     */
    @org.springframework.transaction.annotation.Transactional
    public String deleteStaffByMistake(String userId, String adminUsername) {
        User staffUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario del personal no encontrado."));

        if (staffUser.getUsername().equalsIgnoreCase(adminUsername)) {
            throw new IllegalArgumentException("No puedes eliminar tu propia cuenta de Administrador.");
        }

        boolean hasAssignedPatients = !userRepository.findByPrimaryPhysio(staffUser).isEmpty();
        boolean hasAppointments = !appointmentRepository
                .findByProfessionalIdOrderByAppointmentDateDesc(userId).isEmpty();
        boolean hasHistories = clinicalHistoryRepository.existsByPhysiotherapistId(userId);
        boolean hasPrescriptions = !prescriptionRepository
                .findByPhysiotherapistIdOrderByCreatedAtDesc(userId).isEmpty();

        if (hasAssignedPatients || hasAppointments || hasHistories || hasPrescriptions) {
            throw new IllegalStateException(
                    "Este profesional ya cuenta con pacientes asignados, citas o historias clínicas firmadas. "
                            + "Para conservar la trazabilidad legal y contable, reasigna primero sus pacientes y utiliza el botón 'Suspender Cuenta'.");
        }

        String deletedUsername = staffUser.getUsername();
        String deletedEmail = staffUser.getEmail();
        userRepository.delete(staffUser);

        auditService.logAction(adminUsername, "DELETE_STAFF_MISTAKE", userId,
                "Miembro del personal @" + deletedUsername + " (" + deletedEmail
                        + ") eliminado definitivamente por haber sido creado por error (sin actividad clínica).");

        return "El usuario @" + deletedUsername
                + " no tenía actividad clínica y fue eliminado definitivamente. Su correo y usuario han quedado libres.";
    }

    /**
     * Genera una contraseña temporal de recuperación cuando el usuario olvida su
     * contraseña.
     * Devuelve el usuario y la clave en texto plano para envío por correo, o
     * Optional.empty() si no aplica.
     */
    @org.springframework.transaction.annotation.Transactional
    public Optional<java.util.Map.Entry<User, String>> resetPasswordByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return Optional.empty();
        }
        String clean = identifier.trim();
        Optional<User> userOpt = userRepository.findByUsername(clean)
                .or(() -> userRepository.findByEmailIgnoreCase(clean));

        if (userOpt.isEmpty() || !Boolean.TRUE.equals(userOpt.get().getEnabled())) {
            return Optional.empty();
        }

        User user = userOpt.get();
        String randomSuffix = java.util.UUID.randomUUID().toString().substring(0, 6);
        String tempPassword = "Rec-" + randomSuffix;

        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setMustChangePassword(true);
        user.setTokenVersion((user.getTokenVersion() == null ? 0 : user.getTokenVersion()) + 1);
        userRepository.save(user);

        auditService.logAction(user.getUsername(), "PASSWORD_RECOVERY_REQUEST", user.getId(),
                "Se generó contraseña temporal de recuperación y se solicitó cambio obligatorio al ingresar.");

        return Optional.of(java.util.Map.entry(user, tempPassword));
    }

    /**
     * Devuelve todos los usuarios que tengan un rol específico (Ej:
     * ROLE_FISIOTERAPEUTA)
     */
    public java.util.List<User> findByRole(String roleName) {
        return userRepository.findByRoles_Name(roleName);
    }

    /**
     * Devuelve los fisioterapeutas visibles para el usuario actual:
     * - Si es PACIENTE: solo ve al fisioterapeuta que lo dio de alta
     * (primaryPhysio)
     * y/o a los fisioterapeutas con quienes ya tiene citas agendadas.
     */
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public java.util.List<UserDTO> getProfessionalsForUser(String username, boolean isPatient) {
        if (!isPatient) {
            return findByRole("ROLE_FISIOTERAPEUTA").stream()
                    .filter(u -> Boolean.TRUE.equals(u.getEnabled()))
                    .map(this::convertToDTO)
                    .toList();
        }

        User patient = userRepository.findByUsername(username).orElse(null);
        if (patient == null) {
            return java.util.List.of();
        }

        java.util.List<String> allowedPhysioIds = new java.util.ArrayList<>();

        // 1. Fisioterapeuta que lo dio de alta (si tiene rol de fisioterapeuta)
        User primary = patient.getPrimaryPhysio();
        if (primary != null && primary.getRoles() != null) {
            boolean isPrimaryAFisio = primary.getRoles().stream()
                    .anyMatch(r -> "ROLE_FISIOTERAPEUTA".equals(r.getName()));
            if (isPrimaryAFisio) {
                allowedPhysioIds.add(primary.getId());
            }
        }

        // 2. Fisioterapeutas con los que ya ha tenido citas
        appointmentRepository.findDistinctProfessionalIdsByPatientId(patient.getId()).forEach(id -> {
            if (!allowedPhysioIds.contains(id)) {
                allowedPhysioIds.add(id);
            }
        });

        // Devolver únicamente su(s) fisioterapeuta(s) asignado(s)
        if (!allowedPhysioIds.isEmpty()) {
            return userRepository.findAllById(allowedPhysioIds).stream()
                    .map(this::convertToDTO)
                    .toList();
        }

        return findByRole("ROLE_FISIOTERAPEUTA").stream()
                .map(this::convertToDTO)
                .toList();
    }
}
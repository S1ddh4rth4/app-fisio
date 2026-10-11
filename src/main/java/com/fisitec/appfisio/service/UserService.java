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
    private final BCryptPasswordEncoder passwordEncoder;
    private final AuditService auditService; // 🛡️ Inyectamos al Big Brother

    public UserService(UserRepository userRepository, RoleRepository roleRepository,
            @Lazy BCryptPasswordEncoder passwordEncoder, AuditService auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
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
        dto.setRoles(user.getRoles() != null
                ? user.getRoles().stream().map(role -> role.getName()).collect(Collectors.toSet())
                : java.util.Collections.emptySet());
        dto.setEnabled(user.getEnabled());
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
    public void changePassword(String username, String currentPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("La contraseña actual es incorrecta");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);
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
     * Derecho al Olvido (Soft Delete & Anonymization)
     * Borra la identidad del paciente, pero mantiene su historial clínico
     * encriptado para fines de métricas de la clínica.
     */
    @org.springframework.transaction.annotation.Transactional
    public void deleteAndAnonymizePatient(String patientId, String adminUsername) {
        // 1. Buscamos al paciente
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado en el sistema."));

        // 2. Regla de Negocio: Validar que solo borremos pacientes
        boolean isPatient = patient.getRoles().stream()
                .anyMatch(role -> role.getName().equals("ROLE_PACIENTE"));

        if (!isPatient) {
            throw new IllegalArgumentException("¡Alto! No puedes anonimizar a un fisioterapeuta o administrador.");
        }

        // 3. Generamos un código aleatorio para destruir su identidad
        String randomSuffix = java.util.UUID.randomUUID().toString().substring(0, 8);

        // 4. Anonimización destructiva (PII Scrambling)
        patient.setUsername("borrado_" + randomSuffix);
        patient.setEmail("anon_" + randomSuffix + "@borrado.com");
        patient.setPassword("CUENTA_DESTRUIDA_IRREVERSIBLE"); // Invalidamos su login
        patient.setEnabled(false); // Apagamos la cuenta en Spring Security

        userRepository.save(patient);

        // 5. ¡Vigilancia! El administrador que hizo esto queda grabado para siempre
        auditService.logAction(adminUsername, "ANONYMIZE_PATIENT", patientId,
                "El paciente exigió su Derecho al Olvido. Datos PII destruidos.");
    }

    /**
     * Devuelve todos los usuarios que tengan un rol específico (Ej:
     * ROLE_FISIOTERAPEUTA)
     */
    public java.util.List<User> findByRole(String roleName) {
        return userRepository.findByRoles_Name(roleName);
    }
}
package com.fisitec.appfisio.service;

import com.fisitec.appfisio.dto.UserDTO;
import com.fisitec.appfisio.entity.Role;
import com.fisitec.appfisio.entity.User;
import com.fisitec.appfisio.repository.RoleRepository;
import com.fisitec.appfisio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service for handling user-related operations.
 * Manages user creation, retrieval, and role assignment.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * Find a user by username.
     * 
     * @param username the username
     * @return Optional containing the user if found
     */
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
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
        if (user.getPassword() != null && !user.getPassword().startsWith("UserDTOa$")) {
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

        // Assign default role
        Role defaultRole = roleRepository.findByName(defaultRoleName)
                .orElseThrow(() -> new RuntimeException("Default role not found: " + defaultRoleName));
        user.setRoles(Set.of(defaultRole));

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

    public UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRoles(user.getRoles() != null
                ? user.getRoles().stream().map(role -> role.getName()).collect(Collectors.toSet())
                : java.util.Collections.emptySet());
        dto.setEnabled(user.getEnabled());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }

    /**
     * Change user password after verifying the current password.
     */
    public void changePassword(String username, String currentPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("La contraseña actual es incorrecta");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
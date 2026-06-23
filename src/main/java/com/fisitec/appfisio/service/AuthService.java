package com.fisitec.appfisio.service;

import com.fisitec.appfisio.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

/**
 * Service for handling authentication operations.
 * Manages user registration and login logic.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserService userService;
    private final JwtService jwtService;

    /**
     * Register a new user.
     * 
     * @param username the username
     * @param email    the email
     * @param password the password
     * @return the created user
     * @throws RuntimeException if username or email already exists
     */
    public User register(String username, String email, String password, String role) {
        // Check if username or email already exists
        if (userService.existsByUsername(username)) {
            throw new RuntimeException("Username already exists: " + username);
        }
        if (userService.existsByEmail(email)) {
            throw new RuntimeException("Email already exists: " + email);
        }

        // Create and save the user
        return userService.createUser(username, email, password, role);
    }

    /**
     * Authenticate a user and generate JWT token.
     * 
     * @param loginIdentifier the username or email
     * @param password        the password
     * @return the JWT token
     * @throws BadCredentialsException if authentication fails
     */
    public String login(String loginIdentifier, String password) {
        // Find user by username or email
        User user = userService.findByUsername(loginIdentifier)
                .orElseGet(() -> userService.findByEmail(loginIdentifier)
                        .orElseThrow(() -> new BadCredentialsException("Invalid username/email or password")));

        // Check if account is enabled
        if (!user.getEnabled()) {
            throw new BadCredentialsException("Account is disabled");
        }

        // Verify password
        if (!userService.matchesPassword(password, user.getPassword())) {
            throw new BadCredentialsException("Invalid username/email or password");
        }

        // Generate and return JWT token
        return jwtService.generateToken(new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                user.getEnabled(),
                true, true, true, // accountNonExpired, credentialsNonExpired, accountNonLocked
                user.getRoles().stream()
                        .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                role.getName()))
                        .collect(Collectors.toList())));
    }
}
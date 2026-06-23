package com.fisitec.appfisio.controller;

import com.fisitec.appfisio.dto.AuthResponse;
import com.fisitec.appfisio.dto.LoginRequest;
import com.fisitec.appfisio.dto.RegisterRequest;
import com.fisitec.appfisio.dto.UserDTO;
import com.fisitec.appfisio.entity.User;
import com.fisitec.appfisio.service.AuthService;
import com.fisitec.appfisio.service.JwtService;
import com.fisitec.appfisio.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for authentication endpoints.
 * Handles user registration and login.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication management APIs")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final UserService userService;

    /**
     * Register a new user.
     * 
     * @param request the registration request
     * @return the authentication response with token
     */
    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Creates a new user account with default role")
    public ResponseEntity<UserDTO> register(@Valid @RequestBody RegisterRequest request) {

        User user = authService.register(request.getUsername(), request.getEmail(), request.getPassword(),
                request.getRole());

        UserDTO response = userService.convertToDTO(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Authenticate a user.
     * 
     * @param request the login request
     * @return the authentication response with token
     */
    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Authenticates a user and returns JWT token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {

        String token = authService.login(request.getLoginIdentifier(), request.getPassword());
        String username = jwtService.extractUsername(token);
        User user = userService.findByUsername(username).orElseThrow();
        String roles = user.getRoles().stream().map(role -> role.getName()).reduce("", (a, b) -> a + "," + b);
        if (roles.startsWith(","))
            roles = roles.substring(1);
        AuthResponse response = new AuthResponse(token, user.getUsername(), user.getEmail(), roles);
        return ResponseEntity.ok(response);

    }
}
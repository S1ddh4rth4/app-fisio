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
    private final com.fisitec.appfisio.service.MfaService mfaService;

    /**
     * Registra un nuevo usuario en la plataforma con rol por defecto de Paciente.
     * 
     * @param request Datos de registro (nombre de usuario, correo y contraseña).
     * @return DTO con la información pública del usuario creado.
     */
    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Creates a new user account with default role")
    public ResponseEntity<UserDTO> register(@Valid @RequestBody RegisterRequest request) {

        User user = authService.register(request.getUsername(), request.getEmail(), request.getPassword(),
                "ROLE_PACIENTE");

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
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            // Pasamos el código de 6 dígitos (puede venir nulo la primera vez)
            String token = authService.login(request.getLoginIdentifier(), request.getPassword(), request.getMfaCode());
            String username = jwtService.extractUsername(token);
            User user = userService.findByUsername(username).orElseThrow();
            String roles = user.getRoles().stream().map(role -> role.getName()).reduce("", (a, b) -> a + "," + b);
            if (roles.startsWith(","))
                roles = roles.substring(1);

            return ResponseEntity.ok(
                    new AuthResponse(token, user.getUsername(), user.getEmail(), roles, user.getMustChangePassword()));

        } catch (RuntimeException e) {
            if ("MFA_REQUIRED".equals(e.getMessage())) {
                // El frontend recibirá este error 401 y sabrá que debe mostrar la cajita de 6
                // dígitos
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("MFA_REQUIRED");
            }
            throw e;
        }
    }

    // Endpoint temporal para activar el 2FA al fisio
    @GetMapping("/setup-mfa/{username}")
    public ResponseEntity<String> setupMfa(@PathVariable String username) {
        User user = userService.findByUsername(username).orElseThrow();

        String secret = mfaService.generateSecret();

        // 1. Asignamos los valores limpiamente usando los Setters nativos
        user.setMfaSecret(secret);
        user.setMfaEnabled(true);

        // 2. Guardamos pasando por el Servicio oficial
        userService.updateUser(user);

        // 3. Devolvemos la URI pura
        return ResponseEntity.ok(mfaService.getQrCodeUri(secret, username));
    }
}
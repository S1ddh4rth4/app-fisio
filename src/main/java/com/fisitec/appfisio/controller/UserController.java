package com.fisitec.appfisio.controller;

import com.fisitec.appfisio.dto.ChangePasswordDTO;
import com.fisitec.appfisio.dto.UserDTO;
import com.fisitec.appfisio.entity.User;
import com.fisitec.appfisio.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final com.fisitec.appfisio.service.JwtService jwtService;

    /**
     * Obtiene la información completa del perfil del usuario actualmente
     * autenticado.
     */
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(Authentication authentication) {
        User user = userService.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        return ResponseEntity.ok(userService.convertToDTO(user));
    }

    /**
     * Actualiza los datos del perfil del usuario en sesión (nombre, teléfono,
     * cédula y avatar).
     */
    @PutMapping("/profile")
    public ResponseEntity<UserDTO> updateProfile(
            @Valid @RequestBody com.fisitec.appfisio.dto.UserProfileUpdateDTO request,
            Authentication authentication) {
        UserDTO updated = userService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Lista a los profesionales con rol de fisioterapeuta aplicando aislamiento
     * de cartera cuando quien consulta es un paciente.
     */
    @GetMapping("/professionals")
    public ResponseEntity<java.util.List<UserDTO>> getProfessionals(Authentication authentication) {
        boolean isPatient = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PACIENTE"));

        return ResponseEntity.ok(
                userService.getProfessionalsForUser(authentication.getName(), isPatient));
    }

    /**
     * Permite al usuario en sesión cambiar su contraseña de acceso.
     */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordDTO request,
            Authentication authentication) {

        User updatedUser = userService.changePassword(authentication.getName(), request.getCurrentPassword(),
                request.getNewPassword());
        String newToken = jwtService.generateToken(updatedUser);
        return ResponseEntity.ok(Map.of(
                "message", "Contraseña actualizada exitosamente",
                "token", newToken));
    }

    /**
     * Genera la llave secreta y el código QR en Base64 para configurar Google /
     * Apple Authenticator.
     */
    @PostMapping("/mfa/setup")
    public ResponseEntity<Map<String, String>> setupMfa(Authentication authentication) {
        return ResponseEntity.ok(userService.setupMfa(authentication.getName()));
    }

    /**
     * Confirma el código de 6 dígitos y activa formalmente el 2FA en la cuenta.
     */
    @PostMapping("/mfa/verify")
    public ResponseEntity<Map<String, String>> verifyMfa(
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        userService.verifyAndEnableMfa(authentication.getName(), body.get("code"));
        return ResponseEntity.ok(Map.of("message", "Verificación en 2 pasos (2FA) activada exitosamente."));
    }

    /**
     * Desactiva la verificación en 2 pasos (2FA) para el usuario autenticado.
     */
    @PostMapping("/mfa/disable")
    public ResponseEntity<Map<String, String>> disableMfa(Authentication authentication) {
        userService.disableMfa(authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Verificación en 2 pasos (2FA) desactivada."));
    }
}
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
     * Lista a todos los profesionales con rol de fisioterapeuta para asignación de
     * citas y expedientes.
     */
    @GetMapping("/professionals")
    public ResponseEntity<java.util.List<UserDTO>> getProfessionals() {
        return ResponseEntity.ok(
                userService.findByRole("ROLE_FISIOTERAPEUTA").stream()
                        .map(userService::convertToDTO)
                        .toList());
    }

    /**
     * Permite al usuario en sesión cambiar su contraseña de acceso.
     */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordDTO request,
            Authentication authentication) {

        userService.changePassword(authentication.getName(), request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada exitosamente"));
    }
}
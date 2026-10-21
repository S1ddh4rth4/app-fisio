package com.fisitec.appfisio.controller;

import com.fisitec.appfisio.dto.AdminUserRequestDTO;
import com.fisitec.appfisio.dto.UserDTO;
import com.fisitec.appfisio.entity.User;
import com.fisitec.appfisio.service.AuthService;
import com.fisitec.appfisio.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Controller for admin-only user management.
 * Only ROLE_ADMIN can create users with arbitrary roles.
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin - User Management", description = "Admin-only endpoints for creating users with any role")
public class AdminUserController {

    private final AuthService authService;
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all clinic staff members (Admin only)")
    public ResponseEntity<List<UserDTO>> getAllStaff() {
        List<User> fisios = userService.findByRole("ROLE_FISIOTERAPEUTA");
        List<User> recepcion = userService.findByRole("ROLE_RECEPCION");
        List<User> admins = userService.findByRole("ROLE_ADMIN");

        List<UserDTO> staff = new ArrayList<>();
        fisios.forEach(u -> staff.add(userService.convertToDTO(u)));
        recepcion.forEach(u -> staff.add(userService.convertToDTO(u)));
        admins.forEach(u -> staff.add(userService.convertToDTO(u)));

        return ResponseEntity.ok(staff);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a user with any role (Admin only)")
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody AdminUserRequestDTO request) {
        User user = authService.register(
                request.getUsername(),
                request.getEmail(),
                request.getPassword(),
                request.getRole(),
                request.getFullName());
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.convertToDTO(user));
    }

    @PatchMapping("/{userId}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Suspend or reactivate a staff member account (Admin only)")
    public ResponseEntity<UserDTO> toggleStaffStatus(
            @PathVariable String userId,
            org.springframework.security.core.Authentication authentication) {
        return ResponseEntity.ok(userService.toggleStaffStatus(userId, authentication.getName()));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a staff member created by mistake if they have no clinical records (Admin only)")
    public ResponseEntity<java.util.Map<String, String>> deleteStaffByMistake(
            @PathVariable String userId,
            org.springframework.security.core.Authentication authentication) {
        String message = userService.deleteStaffByMistake(userId, authentication.getName());
        return ResponseEntity.ok(java.util.Map.of("message", message));
    }
}
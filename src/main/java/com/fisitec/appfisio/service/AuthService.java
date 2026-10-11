package com.fisitec.appfisio.service;

import com.fisitec.appfisio.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

/**
 * Servicio encargado del flujo de autenticación, registro y verificación de
 * sesiones.
 * Coordina el cifrado de contraseñas, tokens JWT y autenticación en dos
 * factores (2FA).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserService userService;
    private final JwtService jwtService;
    private final MfaService mfaService;

    /**
     * Registra un nuevo usuario validando que no existan duplicados.
     * 
     * @param username Nombre de usuario único.
     * @param email    Correo electrónico único.
     * @param password Contraseña en texto plano (se cifra con BCrypt antes de
     *                 guardar).
     * @param role     Rol del sistema asignado.
     * @return Entidad del usuario persistida.
     */
    public User register(String username, String email, String password, String role) {
        // Validación de unicidad de usuario y correo
        if (userService.existsByUsername(username)) {
            throw new RuntimeException("El nombre de usuario ya está en uso: " + username);
        }
        if (userService.existsByEmail(email)) {
            throw new RuntimeException("El correo electrónico ya está registrado: " + email);
        }

        // Creación y persistencia segura del usuario
        return userService.createUser(username, email, password, role);
    }

    /**
     * Autentica credenciales y emite el token JWT si la contraseña y el 2FA son
     * válidos.
     */
    public String login(String loginIdentifier, String password, String mfaCode) {
        User user = userService.findByUsername(loginIdentifier)
                .orElseGet(() -> userService.findByEmail(loginIdentifier)
                        .orElseThrow(() -> new BadCredentialsException("Invalid username/email or password")));

        if (!user.getEnabled()) {
            throw new BadCredentialsException("Account is disabled");
        }

        if (!userService.matchesPassword(password, user.getPassword())) {
            throw new BadCredentialsException("Invalid username/email or password");
        }

        // --- 🛡️ FASE 6: VALIDACIÓN DE 2FA ---
        if (user.getMfaEnabled()) {
            if (mfaCode == null || mfaCode.isBlank()) {
                throw new RuntimeException("MFA_REQUIRED"); // Detiene el login y exige el código
            }
            if (!mfaService.verifyCode(user.getMfaSecret(), mfaCode)) {
                throw new BadCredentialsException("El código de 6 dígitos es incorrecto o expiró.");
            }
        }

        return jwtService.generateToken(new org.springframework.security.core.userdetails.User(
                user.getUsername(), user.getPassword(), user.getEnabled(),
                true, true, true,
                user.getRoles().stream()
                        .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                role.getName()))
                        .collect(Collectors.toList())));
    }
}
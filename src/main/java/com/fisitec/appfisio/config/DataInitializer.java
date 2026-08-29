package com.fisitec.appfisio.config;

import com.fisitec.appfisio.entity.Role;
import com.fisitec.appfisio.repository.RoleRepository;
import com.fisitec.appfisio.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Data initializer to seed default roles and users on application startup.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserService userService;

    @Override
    public void run(String... args) {
        // 1. Roles del sistema
        createRoleIfNotExists("ROLE_ADMIN");
        createRoleIfNotExists("ROLE_FISIOTERAPEUTA");
        createRoleIfNotExists("ROLE_PACIENTE");

        // 2. Administrador
        if (!userService.existsByUsername("admin")) {
            userService.createUser("admin", "admin@appfisio.com", "admin123", "ROLE_ADMIN");
        }

        // 3. Fisioterapeuta
        if (!userService.existsByUsername("fisio1")) {
            userService.createUser("fisio1", "fisio1@appfisio.com", "fisio123", "ROLE_FISIOTERAPEUTA");
        }

        // 4. Paciente
        if (!userService.existsByUsername("paciente1")) {
            userService.createUser("paciente1", "paciente1@appfisio.com", "paciente123", "ROLE_PACIENTE");
        }
    }

    private void createRoleIfNotExists(String roleName) {
        if (roleRepository.findByName(roleName).isEmpty()) {
            Role role = new Role();
            role.setName(roleName);
            roleRepository.save(role);
        }
    }
}
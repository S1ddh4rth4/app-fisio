package com.fisitec.appfisio.config;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Le dice a Spring Data JPA quién es el usuario actual para llenar
 * automáticamente los campos @CreatedBy y @LastModifiedBy.
 */
@Component
public class AuditorAwareImpl implements AuditorAware<String> {

    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            return Optional.of("SYSTEM"); // Para registros hechos por el sistema antes del login
        }

        return Optional.of(authentication.getName()); // Retorna el username o ID del usuario logueado
    }
}
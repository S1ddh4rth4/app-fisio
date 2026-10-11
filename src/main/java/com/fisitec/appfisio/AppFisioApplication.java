package com.fisitec.appfisio;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Main entry point of the AppFisio Spring Boot application.
 * <p>
 * This class boots the Spring context and starts the embedded server.
 * It does not contain business logic, only application startup configuration.
 * </p>
 */
@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditorAwareImpl")
public class AppFisioApplication {
    public static void main(String[] args) {
        SpringApplication.run(AppFisioApplication.class, args);
    }
}

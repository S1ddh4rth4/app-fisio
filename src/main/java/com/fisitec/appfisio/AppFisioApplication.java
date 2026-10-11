package com.fisitec.appfisio;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Main entry point of the AppFisio Spring Boot application.
 * <p>
 * This class boots the Spring context and starts the embedded server.
 * It does not contain business logic, only application startup configuration.
 * </p>
 */
@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditorAwareImpl")
@EnableAsync
public class AppFisioApplication {
    public static void main(String[] args) {
        SpringApplication.run(AppFisioApplication.class, args);
    }
}

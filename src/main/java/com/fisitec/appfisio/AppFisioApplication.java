package com.fisitec.appfisio;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point of the AppFisio Spring Boot application.
 * <p>
 * This class boots the Spring context and starts the embedded server.
 * It does not contain business logic, only application startup configuration.
 * </p>
 */
@SpringBootApplication
public class AppFisioApplication {

    /**
     * Start the application.
     * @param args application arguments
     */
    public static void main(String[] args) {
        SpringApplication.run(AppFisioApplication.class, args);
    }

}

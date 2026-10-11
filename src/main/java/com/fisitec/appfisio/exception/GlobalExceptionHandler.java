package com.fisitec.appfisio.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Manejador global de excepciones para toda la API REST.
 * Centraliza y estandariza los códigos de error HTTP y respuestas JSON.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Maneja errores de validación de campos (@Valid en DTOs de entrada).
     * Devuelve cada campo con su mensaje de error correspondiente.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(errors);
    }

    /**
     * Maneja fallos de autenticación por credenciales incorrectas.
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentialsException(BadCredentialsException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Credenciales incorrectas");
        error.put("message", "El nombre de usuario, correo o contraseña ingresados no coinciden.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * Handle illegal argument and illegal state exceptions (reglas de negocio y
     * blindaje de expediente).
     * 
     * @param ex the exception
     * @return error response claro con código 400
     */
    @ExceptionHandler({ IllegalArgumentException.class, IllegalStateException.class })
    public ResponseEntity<Map<String, String>> handleBusinessExceptions(RuntimeException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Regla de Negocio");
        error.put("message", ex.getMessage());
        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Handle database integrity violation exceptions (longitud de texto, valores
     * únicos duplicados).
     * 
     * @param ex the data integrity exception
     * @return error response amigable sin exponer sentencias SQL
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityException(DataIntegrityViolationException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Error de datos");
        error.put("message",
                "El texto ingresado supera el límite permitido o viola una restricción de la base de datos.");
        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Handle access denied exceptions (RBAC).
     * 
     * @param ex the access denied exception
     * @return error response
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDeniedException(AccessDeniedException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Forbidden");
        error.put("message", "No tienes permisos suficientes para acceder a este recurso.");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    /**
     * Handle unexpected runtime exceptions.
     * 
     * @param ex the runtime exception
     * @return error response
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        ex.printStackTrace(); // <-- AGREGADO PARA QUE SPRING BOOT IMPRIMA EL ERROR EN TERMINAL
        Map<String, String> error = new HashMap<>();
        error.put("error", "Internal server error");
        error.put("message", "Ocurrió un error interno en el servidor. Por favor, intenta de nuevo.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
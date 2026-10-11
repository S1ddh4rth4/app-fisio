package com.fisitec.appfisio.service;

import com.fisitec.appfisio.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("Debe generar llopez para la primera Laura López")
    void shouldGenerateBaseUsernameForFirstPatient() {
        when(userRepository.existsByUsername("llopez")).thenReturn(false);

        String username = userService.generateUniqueUsername("Laura López");

        assertEquals("llopez", username);
    }

    @Test
    @DisplayName("Debe generar llopez1 cuando llopez ya existe en el sistema")
    void shouldGenerateSequentialUsernameWhenBaseExists() {
        when(userRepository.existsByUsername("llopez")).thenReturn(true);
        when(userRepository.existsByUsername("llopez1")).thenReturn(false);

        String username = userService.generateUniqueUsername("Laura López");

        assertEquals("llopez1", username);
    }
}
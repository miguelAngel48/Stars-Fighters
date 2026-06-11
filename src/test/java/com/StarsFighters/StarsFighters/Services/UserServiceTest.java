package com.StarsFighters.StarsFighters.Services;

import com.StarsFighters.StarsFighters.Models.Dto.CreateUser;
import com.StarsFighters.StarsFighters.Models.Dto.LoginUser;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Repositories.CosmeticRepo;
import com.StarsFighters.StarsFighters.Repositories.UserRepo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepo userRepo;

    @Mock
    private CosmeticRepo cosmeticRepo;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void registUser_LanzaExcepcion_SiElEmailYaExiste() {
        CreateUser newUser = new CreateUser("test@test.com", "usuario", "password123", "password123");
        when(userRepo.existsByEmail("test@test.com")).thenReturn(true);
        Exception exception = assertThrows(RuntimeException.class, () -> {
            userService.registUser(newUser);
        });

        assertEquals("El email ya esta registrado", exception.getMessage());
        verify(userRepo, never()).save(any(User.class)); // Verificamos que NO se ha guardado
    }

    @Test
    void loginUser_LanzaExcepcion_SiCredencialesSonInvalidas() {
        LoginUser loginData = new LoginUser("wrong@test.com", "1234");
        when(userRepo.findByEmail("wrong@test.com")).thenReturn(Optional.empty());
        Exception exception = assertThrows(RuntimeException.class, () -> {
            userService.loginUser(loginData);
        });

        assertEquals("Credenciales invalidas", exception.getMessage());
    }

    @Test
    void loginUser_DevuelveUsuario_SiCredencialesSonCorrectas() {
        LoginUser loginData = new LoginUser("test@test.com", "correctPassword");
        User mockUser = new User();
        mockUser.setEmail("test@test.com");
        mockUser.setPassword("encodedPassword"); // Contraseña simulada en BD

        when(userRepo.findByEmail("test@test.com")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("correctPassword", "encodedPassword")).thenReturn(true);

        User loggedUser = userService.loginUser(loginData);

        assertNotNull(loggedUser);
        assertEquals("test@test.com", loggedUser.getEmail());
    }
}
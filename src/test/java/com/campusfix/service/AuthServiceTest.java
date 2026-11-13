package com.campusfix.service;

import com.campusfix.dto.ApiDtos.RegisterRequest;
import com.campusfix.model.Role;
import com.campusfix.model.User;
import com.campusfix.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    private BCryptPasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthService(userRepository, passwordEncoder);
    }

    @Test
    void registrationCreatesStudentWithNormalizedEmailAndEncodedPassword() {
        when(userRepository.existsByEmail("alex@example.edu")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User user = authService.register(new RegisterRequest(" Alex Morgan ", "Alex@Example.edu", "Secret@123"));

        assertEquals("Alex Morgan", user.getName());
        assertEquals("alex@example.edu", user.getEmail());
        assertEquals(Role.STUDENT, user.getRole());
        assertTrue(passwordEncoder.matches("Secret@123", user.getPassword()));
        assertNotEquals("Secret@123", user.getPassword());
    }

    @Test
    void registrationRejectsAnExistingEmailWithoutSaving() {
        when(userRepository.existsByEmail("alex@example.edu")).thenReturn(true);

        assertThrows(AuthService.EmailAlreadyRegisteredException.class,
                () -> authService.register(new RegisterRequest("Alex Morgan", "Alex@Example.edu", "Secret@123")));

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void loginLookupIsCaseInsensitive() {
        User user = new User("Alex Morgan", "alex@example.edu", passwordEncoder.encode("Secret@123"), Role.STUDENT);
        when(userRepository.findByEmail("alex@example.edu")).thenReturn(Optional.of(user));
        CustomUserDetailsService userDetailsService = new CustomUserDetailsService(userRepository);

        var details = userDetailsService.loadUserByUsername("ALEX@EXAMPLE.EDU");

        assertEquals("alex@example.edu", details.getUsername());
        assertTrue(details.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT")));
    }
}

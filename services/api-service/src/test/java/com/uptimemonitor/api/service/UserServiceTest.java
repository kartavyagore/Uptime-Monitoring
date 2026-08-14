package com.uptimemonitor.api.service;

import com.uptimemonitor.common.entity.User;
import com.uptimemonitor.common.enums.UserStatus;
import com.uptimemonitor.common.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private static final String GOOGLE_SUBJECT = "google-sub-123";
    private static final String EMAIL = "user@example.com";
    private static final String NAME = "Test User";
    private static final String PICTURE = "https://example.com/photo.jpg";

    @Test
    void shouldCreateNewUserWhenNotExists() {
        when(userRepository.findByGoogleSubject(GOOGLE_SUBJECT)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });

        User user = userService.findOrCreateUser(GOOGLE_SUBJECT, EMAIL, NAME, PICTURE);

        assertNotNull(user);
        assertEquals(GOOGLE_SUBJECT, user.getGoogleSubject());
        assertEquals(EMAIL, user.getEmail());
        assertEquals(NAME, user.getName());
        assertEquals(UserStatus.ACTIVE, user.getStatus());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void shouldUpdateExistingUserOnLogin() {
        User existing = User.builder()
                .id(UUID.randomUUID())
                .googleSubject(GOOGLE_SUBJECT)
                .email("old@example.com")
                .name("Old Name")
                .status(UserStatus.ACTIVE)
                .build();

        when(userRepository.findByGoogleSubject(GOOGLE_SUBJECT)).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User user = userService.findOrCreateUser(GOOGLE_SUBJECT, EMAIL, NAME, PICTURE);

        assertEquals(EMAIL, user.getEmail()); // Updated
        assertEquals(NAME, user.getName()); // Updated
        verify(userRepository).save(existing);
    }

    @Test
    void shouldFindByGoogleSubject() {
        User existing = User.builder().id(UUID.randomUUID()).googleSubject(GOOGLE_SUBJECT).build();
        when(userRepository.findByGoogleSubject(GOOGLE_SUBJECT)).thenReturn(Optional.of(existing));

        Optional<User> found = userService.findByGoogleSubject(GOOGLE_SUBJECT);

        assertTrue(found.isPresent());
        assertEquals(GOOGLE_SUBJECT, found.get().getGoogleSubject());
    }
}

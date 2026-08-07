package com.chitchat.backend.service;

import com.chitchat.backend.dto.UserSearchDto;
import com.chitchat.backend.model.User;
import com.chitchat.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User currentUser;
    private User targetUser;

    @BeforeEach
    void setUp() {
        currentUser = User.builder()
                .id("user-111")
                .name("Current User")
                .email("current@aura.com")
                .username("current_user")
                .pic("https://example.com/current.png")
                .build();

        targetUser = User.builder()
                .id("user-222")
                .name("Vicky Developer")
                .email("vicky@aura.com")
                .username("vicky123")
                .pic("https://example.com/vicky.png")
                .build();
    }

    @Test
    void testNormalizeUsername_ValidCases() {
        assertEquals("vicky123", userService.normalizeUsername("@Vicky123"));
        assertEquals("vicky123", userService.normalizeUsername("vicky123"));
        assertEquals("vicky.dev_01", userService.normalizeUsername(" @Vicky.Dev_01 "));
    }

    @Test
    void testNormalizeUsername_InvalidCases() {
        assertThrows(IllegalArgumentException.class, () -> userService.normalizeUsername(null));
        assertThrows(IllegalArgumentException.class, () -> userService.normalizeUsername("ab")); // < 3 chars
        assertThrows(IllegalArgumentException.class, () -> userService.normalizeUsername("a".repeat(31))); // > 30 chars
        assertThrows(IllegalArgumentException.class, () -> userService.normalizeUsername("user name")); // space
        assertThrows(IllegalArgumentException.class, () -> userService.normalizeUsername("user@name")); // @ inside
    }

    @Test
    void testFindUserByExactUsername_Success() {
        when(userRepository.findByUsername("vicky123")).thenReturn(Optional.of(targetUser));

        UserSearchDto.UserSearchResponse response = userService.findUserByExactUsername("@Vicky123", currentUser);

        assertNotNull(response);
        assertEquals("user-222", response.getPublicId());
        assertEquals("vicky123", response.getUsername());
        assertEquals("Vicky Developer", response.getDisplayName());
        assertEquals("https://example.com/vicky.png", response.getProfilePictureUrl());

        verify(userRepository, times(1)).findByUsername("vicky123");
    }

    @Test
    void testFindUserByExactUsername_SelfSearchPrevented() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            userService.findUserByExactUsername("@Current_User", currentUser);
        });

        assertTrue(exception.getMessage().contains("SELF_USER"));
        verify(userRepository, never()).findByUsername(anyString());
    }

    @Test
    void testFindUserByExactUsername_UserNotFound() {
        when(userRepository.findByUsername("unknown_user")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.findUserByExactUsername("unknown_user", currentUser);
        });

        assertTrue(exception.getMessage().contains("USER_NOT_FOUND"));
        verify(userRepository, times(1)).findByUsername("unknown_user");
    }
}

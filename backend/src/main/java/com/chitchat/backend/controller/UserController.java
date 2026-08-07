package com.chitchat.backend.controller;

import com.chitchat.backend.dto.AuthDto;
import com.chitchat.backend.model.User;
import com.chitchat.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<AuthDto.AuthResponse> registerUser(@RequestBody AuthDto.RegisterRequest request) {
        return ResponseEntity.ok(userService.registerUser(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthDto.AuthResponse> registerUserAlias(@RequestBody AuthDto.RegisterRequest request) {
        return ResponseEntity.ok(userService.registerUser(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDto.AuthResponse> authUser(@RequestBody AuthDto.LoginRequest request) {
        return ResponseEntity.ok(userService.authUser(request));
    }

    @PostMapping("/google/login")
    public ResponseEntity<AuthDto.AuthResponse> googleLogin(@RequestBody AuthDto.GoogleLoginRequest request) {
        return ResponseEntity.ok(userService.googleLogin(request));
    }

    @GetMapping
    public ResponseEntity<List<User>> searchUsers(
            @RequestParam(value = "search", required = false) String search,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.searchUsers(search, currentUser));
    }

    @GetMapping("/all-users")
    public ResponseEntity<List<User>> allUsers(
            @RequestParam(value = "search", required = false) String search,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.searchUsers(search, currentUser));
    }

    @GetMapping("/by-username/{username}")
    public ResponseEntity<?> getUserByUsername(
            @PathVariable("username") String username,
            @AuthenticationPrincipal User currentUser) {
        try {
            return ResponseEntity.ok(userService.findUserByExactUsername(username, currentUser));
        } catch (IllegalArgumentException e) {
            if (e.getMessage() != null && e.getMessage().startsWith("SELF_USER")) {
                return ResponseEntity.status(400).body(new com.chitchat.backend.dto.UserSearchDto.ErrorResponse(
                        "SELF_USER", "You cannot add yourself."
                ));
            }
            return ResponseEntity.status(400).body(new com.chitchat.backend.dto.UserSearchDto.ErrorResponse(
                    "INVALID_USERNAME", e.getMessage()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(new com.chitchat.backend.dto.UserSearchDto.ErrorResponse(
                    "USER_NOT_FOUND", "No user found with this username."
            ));
        }
    }

    @PostMapping("/find-email")
    public ResponseEntity<java.util.Map<String, String>> findEmail(@RequestBody AuthDto.LoginRequest request) {
        userService.findEmail(request.getEmail());
        return ResponseEntity.ok(java.util.Map.of("message", "User email found successfully"));
    }

    @PutMapping("/update-pic")
    public ResponseEntity<User> updatePic(
            @RequestBody java.util.Map<String, String> request,
            @AuthenticationPrincipal User currentUser) {
        String pic = request.get("pic");
        String userId = currentUser != null ? currentUser.getId() : request.get("userId");
        if (userId == null) {
            throw new RuntimeException("User ID is required");
        }
        return ResponseEntity.ok(userService.updatePic(userId, pic));
    }

    @PutMapping("/update-username")
    public ResponseEntity<?> updateUsername(
            @RequestBody java.util.Map<String, String> request,
            @AuthenticationPrincipal User currentUser) {
        String newUsername = request.get("username");
        String userId = currentUser != null ? currentUser.getId() : request.get("userId");
        if (userId == null) {
            return ResponseEntity.status(400).body(java.util.Map.of("message", "User ID is required"));
        }
        try {
            User updated = userService.updateUsername(userId, newUsername);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(java.util.Map.of(
                    "code", "USERNAME_EXISTS",
                    "message", e.getMessage()
            ));
        }
    }
}

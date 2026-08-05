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
}

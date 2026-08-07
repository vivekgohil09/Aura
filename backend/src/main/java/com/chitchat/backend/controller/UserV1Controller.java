package com.chitchat.backend.controller;

import com.chitchat.backend.dto.UserSearchDto;
import com.chitchat.backend.model.User;
import com.chitchat.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserV1Controller {

    @Autowired
    private UserService userService;

    @GetMapping("/by-username/{username}")
    public ResponseEntity<?> getUserByUsername(
            @PathVariable("username") String username,
            @AuthenticationPrincipal User currentUser) {
        try {
            return ResponseEntity.ok(userService.findUserByExactUsername(username, currentUser));
        } catch (IllegalArgumentException e) {
            if (e.getMessage() != null && e.getMessage().startsWith("SELF_USER")) {
                return ResponseEntity.status(400).body(new UserSearchDto.ErrorResponse(
                        "SELF_USER", "You cannot add yourself."
                ));
            }
            return ResponseEntity.status(400).body(new UserSearchDto.ErrorResponse(
                    "INVALID_USERNAME", e.getMessage()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(new UserSearchDto.ErrorResponse(
                    "USER_NOT_FOUND", "No user found with this username."
            ));
        }
    }
}

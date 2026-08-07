package com.chitchat.backend.service;

import com.chitchat.backend.dto.AuthDto;
import com.chitchat.backend.model.User;
import com.chitchat.backend.repository.UserRepository;
import com.chitchat.backend.security.JwtProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtProvider jwtProvider;

    public AuthDto.AuthResponse registerUser(AuthDto.RegisterRequest request) {
        if (request.getName() == null || request.getEmail() == null || request.getPassword() == null) {
            throw new RuntimeException("Please Enter all the Fields");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("User already exists");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .pic(request.getPic())
                .isAdmin(false)
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtProvider.generateToken(savedUser.getId());

        return new AuthDto.AuthResponse(
                "User registered successfully",
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getPic(),
                savedUser.isAdmin(),
                token
        );
    }

    public AuthDto.AuthResponse authUser(AuthDto.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid Email or Password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid Email or Password");
        }

        String token = jwtProvider.generateToken(user.getId());

        return new AuthDto.AuthResponse(
                "Login Successful!",
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPic(),
                user.isAdmin(),
                token
        );
    }

    public AuthDto.AuthResponse googleLogin(AuthDto.GoogleLoginRequest request) {
        String name = (request.getName() != null && !request.getName().trim().isEmpty()) 
                ? request.getName().trim() 
                : "Google User";

        String email = (request.getEmail() != null && !request.getEmail().trim().isEmpty()) 
                ? request.getEmail().trim().toLowerCase() 
                : "google_user_" + Math.abs(request.getCredential() != null ? request.getCredential().hashCode() : System.currentTimeMillis()) + "@aura.com";

        String pic = (request.getPic() != null && !request.getPic().trim().isEmpty()) 
                ? request.getPic().trim() 
                : "https://cdn-icons-png.flaticon.com/512/149/149071.png";

        User user = userRepository.findByEmail(email).map(existing -> {
            boolean updated = false;
            if (request.getName() != null && !request.getName().trim().isEmpty()) {
                existing.setName(request.getName().trim());
                updated = true;
            }
            if (request.getPic() != null && !request.getPic().trim().isEmpty()) {
                existing.setPic(request.getPic().trim());
                updated = true;
            }
            return updated ? userRepository.save(existing) : existing;
        }).orElseGet(() -> {
            User newUser = User.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode("GOOGLE_SSO_" + System.currentTimeMillis()))
                    .pic(pic)
                    .isAdmin(false)
                    .build();
            return userRepository.save(newUser);
        });

        String token = jwtProvider.generateToken(user.getId());

        return new AuthDto.AuthResponse(
                "Google Login Successful",
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPic(),
                user.isAdmin(),
                token
        );
    }

    public List<User> searchUsers(String search, User currentUser) {
        List<User> users;
        if (search == null || search.trim().isEmpty()) {
            users = userRepository.findAll();
        } else {
            String q = search.trim();
            users = userRepository.searchUsers(q);
            if (users.isEmpty()) {
                String queryLower = q.toLowerCase();
                users = userRepository.findAll().stream()
                        .filter(u -> isFuzzyMatch(u.getName(), queryLower) || isFuzzyMatch(u.getEmail(), queryLower))
                        .collect(java.util.stream.Collectors.toList());
            }
        }

        String defaultPic = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        users.forEach(u -> {
            if (u.getPic() == null || u.getPic().trim().isEmpty() || u.getPic().contains("icon-library.com")) {
                u.setPic(defaultPic);
            }
        });
        return users;
    }

    private boolean isFuzzyMatch(String target, String queryLower) {
        if (target == null || queryLower == null) return false;
        String t = target.toLowerCase();
        if (t.contains(queryLower) || queryLower.contains(t)) return true;
        return levenshteinDistance(t, queryLower) <= 2;
    }

    private int levenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        for (int i = 0; i <= s1.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= s2.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1), dp[i - 1][j - 1] + cost);
            }
        }
        return dp[s1.length()][s2.length()];
    }

    public User findEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found"));
    }

    public User updatePic(String userId, String pic) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (pic != null && !pic.trim().isEmpty()) {
            user.setPic(pic);
        }
        return userRepository.save(user);
    }
}

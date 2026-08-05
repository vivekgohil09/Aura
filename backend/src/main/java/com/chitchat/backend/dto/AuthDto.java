package com.chitchat.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AuthDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private String pic;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GoogleLoginRequest {
        private String credential;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private String _id;
        private String name;
        private String email;
        private String pic;
        private boolean isAdmin;
        private String token;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {
        private String message;
        private String _id;
        private String name;
        private String email;
        private String pic;
        private boolean isAdmin;
        private String token;
        private UserInfo userLogin;

        public AuthResponse(String message, String _id, String name, String email, String pic, boolean isAdmin, String token) {
            this.message = message;
            this._id = _id;
            this.name = name;
            this.email = email;
            this.pic = pic;
            this.isAdmin = isAdmin;
            this.token = token;
            this.userLogin = new UserInfo(_id, name, email, pic, isAdmin, token);
        }
    }
}

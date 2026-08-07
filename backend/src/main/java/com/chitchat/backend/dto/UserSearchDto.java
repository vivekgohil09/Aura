package com.chitchat.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class UserSearchDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSearchResponse {
        private String publicId;
        private String username;
        private String displayName;
        private String profilePictureUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErrorResponse {
        private String code;
        private String message;
    }
}

package com.chitchat.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

public class ChatDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccessChatRequest {
        private String userId;
        private String _id;

        public String getUserId() {
            return userId != null ? userId : _id;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateGroupChatRequest {
        private String name;
        private List<String> users; // JSON array of user IDs
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RenameGroupRequest {
        private String chatId;
        private String chatName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroupMemberRequest {
        private String chatId;
        private String userId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SendRequestDto {
        private String targetUserId;
        private String userId;
        private String _id;
        private String publicId;
        private String username;
        private String email;

        private boolean isValidId(String s) {
            return s != null && !s.trim().isEmpty() && !"undefined".equalsIgnoreCase(s.trim()) && !"null".equalsIgnoreCase(s.trim());
        }

        public String getTargetUserId() {
            if (isValidId(targetUserId)) return targetUserId.trim();
            if (isValidId(userId)) return userId.trim();
            if (isValidId(_id)) return _id.trim();
            if (isValidId(publicId)) return publicId.trim();
            if (isValidId(username)) return username.trim();
            if (isValidId(email)) return email.trim();
            return null;
        }

        public String getCleanUsername() {
            if (isValidId(username)) {
                String u = username.trim();
                return u.startsWith("@") ? u.substring(1) : u;
            }
            return null;
        }

        public String getCleanEmail() {
            if (isValidId(email)) return email.trim().toLowerCase();
            return null;
        }
    }
}

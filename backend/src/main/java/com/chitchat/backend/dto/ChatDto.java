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

        public String getTargetUserId() {
            if (targetUserId != null && !targetUserId.trim().isEmpty()) return targetUserId.trim();
            if (userId != null && !userId.trim().isEmpty()) return userId.trim();
            if (_id != null && !_id.trim().isEmpty()) return _id.trim();
            return null;
        }
    }
}

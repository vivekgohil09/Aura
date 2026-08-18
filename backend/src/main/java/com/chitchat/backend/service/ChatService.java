package com.chitchat.backend.service;

import com.chitchat.backend.dto.ChatDto;
import com.chitchat.backend.model.Chat;
import com.chitchat.backend.model.User;
import com.chitchat.backend.repository.ChatRepository;
import com.chitchat.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ChatService {

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.chitchat.backend.repository.ChatRequestRepository chatRequestRepository;

    @org.springframework.transaction.annotation.Transactional
    public com.chitchat.backend.model.ChatRequest sendChatRequest(ChatDto.SendRequestDto dto, User sender) {
        if (dto == null) {
            throw new IllegalArgumentException("Friend request payload is required");
        }
        return sendChatRequestInternal(dto.getTargetUserId(), dto.getCleanUsername(), dto.getCleanEmail(), sender);
    }

    @org.springframework.transaction.annotation.Transactional
    public com.chitchat.backend.model.ChatRequest sendChatRequest(String targetUserId, User sender) {
        return sendChatRequestInternal(targetUserId, null, null, sender);
    }

    private com.chitchat.backend.model.ChatRequest sendChatRequestInternal(String targetId, String username, String email, User sender) {
        if (sender == null) {
            throw new IllegalArgumentException("Authentication required to send friend request");
        }

        User freshSender = userRepository.findById(sender.getId()).orElse(sender);

        User receiver = resolveUser(targetId, username, email, freshSender);
        if (receiver == null) {
            throw new IllegalArgumentException("Target user not found");
        }

        if (receiver.getId().equals(freshSender.getId()) || 
            (freshSender.getEmail() != null && freshSender.getEmail().equalsIgnoreCase(receiver.getEmail())) ||
            (freshSender.getUsername() != null && freshSender.getUsername().equalsIgnoreCase(receiver.getUsername()))) {
            throw new IllegalArgumentException("You cannot send a friend request to yourself");
        }

        // 1. Check if already friends
        if (freshSender.getFriends() != null && freshSender.getFriends().stream().anyMatch(f -> f.getId().equals(receiver.getId()))) {
            throw new IllegalArgumentException("You are already friends with " + (receiver.getName() != null ? receiver.getName() : "this user") + ".");
        }

        // 2. Check if a PENDING request already exists from sender to receiver
        Optional<com.chitchat.backend.model.ChatRequest> pendingSent = chatRequestRepository
                .findBySenderAndReceiverAndStatus(freshSender, receiver, "PENDING");
        if (pendingSent.isPresent()) {
            throw new IllegalArgumentException("You have already sent a friend request to " + (receiver.getName() != null ? receiver.getName() : "this user") + ". Please wait for them to accept.");
        }

        // 3. Check if there is an incoming PENDING request from receiver to sender
        Optional<com.chitchat.backend.model.ChatRequest> pendingIncoming = chatRequestRepository
                .findBySenderAndReceiverAndStatus(receiver, freshSender, "PENDING");
        if (pendingIncoming.isPresent()) {
            throw new IllegalArgumentException((receiver.getName() != null ? receiver.getName() : "This user") + " has already sent you a friend request. Please check your notifications to accept!");
        }

        // 4. Rate-limiting / Cooldown Check: 2 days (48 hours)
        Optional<com.chitchat.backend.model.ChatRequest> latestRequest = chatRequestRepository
                .findTopBySenderAndReceiverOrderByCreatedAtDesc(freshSender, receiver);
        if (latestRequest.isPresent()) {
            java.time.LocalDateTime lastCreatedAt = latestRequest.get().getCreatedAt();
            if (lastCreatedAt != null) {
                java.time.Duration duration = java.time.Duration.between(lastCreatedAt, java.time.LocalDateTime.now());
                long totalHours = duration.toHours();
                if (totalHours < 48) { // Less than 2 days (48 hours)
                    long hoursRemaining = 48 - totalHours;
                    long minutesRemaining = 60 - (duration.toMinutes() % 60);
                    String remainingTime;
                    if (hoursRemaining >= 24) {
                        long days = hoursRemaining / 24;
                        long remHours = hoursRemaining % 24;
                        remainingTime = days + " day" + (days > 1 ? "s" : "") + (remHours > 0 ? " and " + remHours + " hr" + (remHours > 1 ? "s" : "") : "");
                    } else if (hoursRemaining > 0) {
                        remainingTime = hoursRemaining + " hour" + (hoursRemaining > 1 ? "s" : "") + " and " + minutesRemaining + " min" + (minutesRemaining > 1 ? "s" : "");
                    } else {
                        remainingTime = Math.max(1, minutesRemaining) + " minute" + (minutesRemaining > 1 ? "s" : "");
                    }
                    throw new IllegalArgumentException("Friend request cooldown: You can only send a request once every 2 days. Please wait " + remainingTime + " before sending again.");
                }
            }
        }

        // 5. Create and save new PENDING request
        com.chitchat.backend.model.ChatRequest request = com.chitchat.backend.model.ChatRequest.builder()
                .sender(freshSender)
                .receiver(receiver)
                .status("PENDING")
                .createdAt(java.time.LocalDateTime.now())
                .updatedAt(java.time.LocalDateTime.now())
                .build();
        return chatRequestRepository.save(request);
    }

    private User resolveUser(String targetId, String username, String email, User sender) {
        String cleanId = targetId != null ? targetId.trim() : null;
        if (cleanId != null && ("undefined".equalsIgnoreCase(cleanId) || "null".equalsIgnoreCase(cleanId))) {
            cleanId = null;
        }
        if (cleanId != null && cleanId.startsWith("@")) {
            cleanId = cleanId.substring(1);
        }

        String cleanUsername = username != null ? username.trim() : null;
        if (cleanUsername != null && cleanUsername.startsWith("@")) {
            cleanUsername = cleanUsername.substring(1);
        }

        String cleanEmail = email != null ? email.trim().toLowerCase() : null;

        // Try cleanId directly
        if (cleanId != null && !cleanId.isEmpty()) {
            final String q = cleanId;
            Optional<User> u = userRepository.findById(q)
                    .or(() -> userRepository.findByUsernameIgnoreCase(q))
                    .or(() -> userRepository.findByEmailIgnoreCase(q))
                    .or(() -> userRepository.findByUsername(q))
                    .or(() -> userRepository.findByEmail(q));
            if (u.isPresent()) return u.get();
        }

        // Try cleanUsername
        if (cleanUsername != null && !cleanUsername.isEmpty()) {
            final String uName = cleanUsername;
            Optional<User> u = userRepository.findByUsernameIgnoreCase(uName)
                    .or(() -> userRepository.findByUsername(uName))
                    .or(() -> userRepository.findById(uName));
            if (u.isPresent()) return u.get();
        }

        // Try cleanEmail
        if (cleanEmail != null && !cleanEmail.isEmpty()) {
            final String em = cleanEmail;
            Optional<User> u = userRepository.findByEmailIgnoreCase(em)
                    .or(() -> userRepository.findByEmail(em));
            if (u.isPresent()) return u.get();
        }

        // Try search fallback
        String fallbackQuery = cleanId != null ? cleanId : (cleanUsername != null ? cleanUsername : cleanEmail);
        if (fallbackQuery != null && !fallbackQuery.isEmpty()) {
            List<User> matches = userRepository.searchUsers(fallbackQuery);
            if (matches != null) {
                for (User m : matches) {
                    if (sender == null || !m.getId().equals(sender.getId())) {
                        return m;
                    }
                }
            }
        }

        return null;
    }

    public List<com.chitchat.backend.model.ChatRequest> getPendingRequests(User receiver) {
        return chatRequestRepository.findByReceiverAndStatus(receiver, "PENDING");
    }

    public List<com.chitchat.backend.model.ChatRequest> getSentPendingRequests(User sender) {
        return chatRequestRepository.findBySenderAndStatus(sender, "PENDING");
    }

    @org.springframework.transaction.annotation.Transactional
    public Chat respondToRequest(String requestId, String action, User currentUser) {
        if (currentUser == null) {
            throw new IllegalArgumentException("Authentication required");
        }
        com.chitchat.backend.model.ChatRequest request = chatRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));

        if (!request.getReceiver().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Unauthorized action on this friend request");
        }

        if ("ACCEPT".equalsIgnoreCase(action)) {
            request.setStatus("ACCEPTED");
            request.setUpdatedAt(java.time.LocalDateTime.now());
            chatRequestRepository.save(request);

            User sender = request.getSender();
            User receiver = request.getReceiver();

            User freshReceiver = userRepository.findById(currentUser.getId()).orElse(currentUser);
            User freshSender = userRepository.findById(sender.getId()).orElse(sender);

            freshReceiver.addFriend(freshSender);
            freshSender.addFriend(freshReceiver);
            userRepository.save(freshReceiver);
            userRepository.save(freshSender);

            return accessChat(freshSender.getId(), freshReceiver);
        } else {
            request.setStatus("REJECTED");
            request.setUpdatedAt(java.time.LocalDateTime.now());
            chatRequestRepository.save(request);
            return null;
        }
    }

    public Chat accessChat(String targetUserId, User currentUser) {
        if (targetUserId == null || targetUserId.trim().isEmpty()) {
            throw new RuntimeException("UserId param not sent with request");
        }
        if (currentUser == null) {
            throw new RuntimeException("Authentication required to access chat");
        }

        String cleanTarget = targetUserId.trim();
        if (cleanTarget.startsWith("@")) cleanTarget = cleanTarget.substring(1);
        final String searchTarget = cleanTarget;

        User targetUser = userRepository.findById(searchTarget)
                .or(() -> userRepository.findByUsernameIgnoreCase(searchTarget))
                .or(() -> userRepository.findByEmailIgnoreCase(searchTarget))
                .or(() -> userRepository.findByUsername(searchTarget))
                .or(() -> userRepository.findByEmail(searchTarget))
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (currentUser.getId().equals(targetUser.getId())) {
            List<Chat> userChats = chatRepository.findChatsByUserId(currentUser.getId());
            for (Chat c : userChats) {
                if (!c.isGroupChat() && c.getUsers() != null && c.getUsers().size() == 1) {
                    return c;
                }
            }
            Set<User> participants = new HashSet<>();
            participants.add(currentUser);
            Chat selfChat = Chat.builder()
                    .chatName("Saved Messages")
                    .isGroupChat(false)
                    .users(participants)
                    .build();
            return chatRepository.save(selfChat);
        }

        List<Chat> existingChats = chatRepository.findChatsByUserId(currentUser.getId());
        for (Chat c : existingChats) {
            if (!c.isGroupChat() && c.getUsers() != null && c.getUsers().size() == 2 && c.getUsers().contains(targetUser)) {
                return c;
            }
        }

        Set<User> participants = new HashSet<>();
        participants.add(currentUser);
        participants.add(targetUser);

        Chat newChat = Chat.builder()
                .chatName("sender")
                .isGroupChat(false)
                .users(participants)
                .build();

        return chatRepository.save(newChat);
    }

    public List<Chat> fetchChats(User currentUser) {
        return chatRepository.findChatsByUserId(currentUser.getId());
    }

    public Chat createGroupChat(ChatDto.CreateGroupChatRequest request, User currentUser) {
        if (request.getName() == null || request.getUsers() == null) {
            throw new RuntimeException("Please Fill all the fields");
        }

        List<String> userIds = request.getUsers();
        if (userIds.size() < 2) {
            throw new RuntimeException("More than 2 users are required to form a group chat");
        }

        Set<User> groupUsers = new HashSet<>();
        for (String id : userIds) {
            userRepository.findById(id).ifPresent(groupUsers::add);
        }
        groupUsers.add(currentUser);

        Chat groupChat = Chat.builder()
                .chatName(request.getName())
                .isGroupChat(true)
                .users(groupUsers)
                .groupAdmin(currentUser)
                .build();

        return chatRepository.save(groupChat);
    }

    public Chat renameGroup(ChatDto.RenameGroupRequest request) {
        Chat chat = chatRepository.findById(request.getChatId())
                .orElseThrow(() -> new RuntimeException("Chat Not Found"));

        chat.setChatName(request.getChatName());
        return chatRepository.save(chat);
    }

    public Chat addToGroup(ChatDto.GroupMemberRequest request) {
        Chat chat = chatRepository.findById(request.getChatId())
                .orElseThrow(() -> new RuntimeException("Chat Not Found"));

        User userToAdd = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User Not Found"));

        chat.getUsers().add(userToAdd);
        return chatRepository.save(chat);
    }

    public Chat removeFromGroup(ChatDto.GroupMemberRequest request) {
        Chat chat = chatRepository.findById(request.getChatId())
                .orElseThrow(() -> new RuntimeException("Chat Not Found"));

        User userToRemove = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User Not Found"));

        chat.getUsers().remove(userToRemove);
        return chatRepository.save(chat);
    }

    public void deleteChat(String chatId, User currentUser) {
        if (chatId != null && chatRepository.existsById(chatId)) {
            chatRepository.deleteById(chatId);
        }
    }
}

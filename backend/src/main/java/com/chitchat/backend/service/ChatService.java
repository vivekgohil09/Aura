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

    public com.chitchat.backend.model.ChatRequest sendChatRequest(String targetUserId, User sender) {
        if (targetUserId == null || targetUserId.trim().isEmpty()) {
            throw new RuntimeException("Target user ID is required");
        }
        String cleanTarget = targetUserId.trim();
        if (sender != null && (cleanTarget.equals(sender.getId()) || cleanTarget.equalsIgnoreCase(sender.getEmail()) || cleanTarget.equalsIgnoreCase(sender.getUsername()))) {
            throw new RuntimeException("You cannot send a friend request to yourself");
        }
        User receiver = userRepository.findById(cleanTarget)
                .or(() -> userRepository.findByEmail(cleanTarget.toLowerCase()))
                .or(() -> userRepository.findByUsername(cleanTarget.toLowerCase()))
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        Optional<com.chitchat.backend.model.ChatRequest> existing = chatRequestRepository
                .findBySenderAndReceiverAndStatus(sender, receiver, "PENDING");
        if (existing.isPresent()) {
            return existing.get();
        }

        com.chitchat.backend.model.ChatRequest request = com.chitchat.backend.model.ChatRequest.builder()
                .sender(sender)
                .receiver(receiver)
                .status("PENDING")
                .build();
        return chatRequestRepository.save(request);
    }

    public List<com.chitchat.backend.model.ChatRequest> getPendingRequests(User receiver) {
        return chatRequestRepository.findByReceiverAndStatus(receiver, "PENDING");
    }

    public List<com.chitchat.backend.model.ChatRequest> getSentPendingRequests(User sender) {
        return chatRequestRepository.findBySenderAndStatus(sender, "PENDING");
    }

    @org.springframework.transaction.annotation.Transactional
    public Chat respondToRequest(String requestId, String action, User currentUser) {
        com.chitchat.backend.model.ChatRequest request = chatRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!request.getReceiver().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized action");
        }

        if ("ACCEPT".equalsIgnoreCase(action)) {
            request.setStatus("ACCEPTED");
            chatRequestRepository.save(request);

            User sender = request.getSender();
            User receiver = request.getReceiver();
            currentUser.addFriend(sender);
            sender.addFriend(currentUser);
            userRepository.save(currentUser);
            userRepository.save(sender);

            return accessChat(sender.getId(), currentUser);
        } else {
            request.setStatus("REJECTED");
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

        User targetUser = userRepository.findById(targetUserId)
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

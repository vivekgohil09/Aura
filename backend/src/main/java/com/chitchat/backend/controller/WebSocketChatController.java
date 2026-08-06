package com.chitchat.backend.controller;

import com.chitchat.backend.dto.MessageDto;
import com.chitchat.backend.model.Chat;
import com.chitchat.backend.model.Message;
import com.chitchat.backend.model.User;
import com.chitchat.backend.repository.ChatRepository;
import com.chitchat.backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.Optional;

@Controller
public class WebSocketChatController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    @Transactional
    public void processMessage(@Payload MessageDto.SendMessageRequest request, Principal principal) {
        if (principal == null) {
            throw new AccessDeniedException("User must be authenticated to send messages");
        }

        User currentUser = null;
        if (principal instanceof UsernamePasswordAuthenticationToken auth && auth.getPrincipal() instanceof User user) {
            currentUser = user;
        }

        if (currentUser == null) {
            throw new AccessDeniedException("Invalid authentication principal");
        }

        final String currentUserId = currentUser.getId();

        if (request.getChatId() == null || request.getContent() == null || request.getContent().isBlank()) {
            throw new IllegalArgumentException("ChatId and message content cannot be empty");
        }

        Chat chat = chatRepository.findById(request.getChatId())
                .orElseThrow(() -> new IllegalArgumentException("Chat not found"));

        // Authorization: Verify user is part of the conversation
        boolean isMember = chat.getUsers().stream().anyMatch(u -> u.getId().equals(currentUserId));
        if (!isMember) {
            throw new AccessDeniedException("User is not authorized for this conversation");
        }

        // Duplicate protection check
        if (request.getClientMessageId() != null && !request.getClientMessageId().isBlank()) {
            Optional<Message> existing = messageRepository.findByClientMessageId(request.getClientMessageId());
            if (existing.isPresent()) {
                messagingTemplate.convertAndSend("/topic/conversations/" + chat.getId(), existing.get());
                return;
            }
        }

        Message message = Message.builder()
                .sender(currentUser)
                .content(request.getContent())
                .chat(chat)
                .clientMessageId(request.getClientMessageId())
                .createdAt(java.time.LocalDateTime.now())
                .build();

        Message savedMessage = messageRepository.save(message);

        chat.setLatestMessage(savedMessage);
        chatRepository.save(chat);

        // Broadcast persisted message to conversation topic
        messagingTemplate.convertAndSend("/topic/conversations/" + chat.getId(), savedMessage);
    }
}

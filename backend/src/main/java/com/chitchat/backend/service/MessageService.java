package com.chitchat.backend.service;

import com.chitchat.backend.dto.MessageDto;
import com.chitchat.backend.model.Chat;
import com.chitchat.backend.model.Message;
import com.chitchat.backend.model.User;
import com.chitchat.backend.repository.ChatRepository;
import com.chitchat.backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public Message sendMessage(MessageDto.SendMessageRequest request, User currentUser) {
        if (request.getContent() == null || request.getChatId() == null) {
            throw new RuntimeException("Invalid data passed into request");
        }

        Chat chat = chatRepository.findById(request.getChatId())
                .orElseThrow(() -> new RuntimeException("Chat not found"));

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

        // Broadcast to STOMP channel for real-time update
        messagingTemplate.convertAndSend("/topic/conversations/" + chat.getId(), savedMessage);
        messagingTemplate.convertAndSend("/topic/chat/" + chat.getId(), savedMessage);

        return savedMessage;
    }

    public List<Message> allMessages(String chatId) {
        return messageRepository.findByChatIdOrderByCreatedAtAsc(chatId);
    }
}

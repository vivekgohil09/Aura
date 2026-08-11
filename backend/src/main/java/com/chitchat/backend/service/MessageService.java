package com.chitchat.backend.service;

import com.chitchat.backend.dto.MessageDto;
import com.chitchat.backend.model.Chat;
import com.chitchat.backend.model.Message;
import com.chitchat.backend.model.User;
import com.chitchat.backend.repository.ChatRepository;
import com.chitchat.backend.repository.MessageRepository;
import com.chitchat.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private UserRepository userRepository;

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
                .createdAt(LocalDateTime.now())
                .build();

        Message savedMessage = messageRepository.save(message);

        chat.setLatestMessage(savedMessage);
        chatRepository.save(chat);

        // Broadcast persisted message to STOMP channel for real-time update
        messagingTemplate.convertAndSend("/topic/conversations/" + chat.getId(), savedMessage);
        messagingTemplate.convertAndSend("/topic/chat/" + chat.getId(), savedMessage);

        return savedMessage;
    }

    public List<Message> allMessages(String chatId) {
        return messageRepository.findByChatIdOrderByCreatedAtAsc(chatId);
    }

    public List<Message> markMessagesRead(String chatId, List<String> messageIds, String readerId) {
        List<Message> updated = new ArrayList<>();
        for (String id : messageIds) {
            Optional<Message> mOpt = messageRepository.findById(id);
            if (mOpt.isPresent()) {
                Message m = mOpt.get();
                m.setIsRead(true);
                m.setSeenAt(LocalDateTime.now());
                updated.add(m);
            }
        }
        if (!updated.isEmpty()) {
            messageRepository.saveAll(updated);
            messagingTemplate.convertAndSend("/topic/message-read/" + chatId, java.util.Map.of("messageIds", messageIds));
        }
        return updated;
    }
}

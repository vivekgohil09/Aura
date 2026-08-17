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
                m.setRead(true);
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

    public java.util.Map<String, Long> getUnreadCounts(List<String> chatIds, String userId) {
        java.util.Map<String, Long> result = new java.util.HashMap<>();
        if (chatIds == null || chatIds.isEmpty()) return result;
        List<Object[]> rows = messageRepository.countUnreadByChatIds(chatIds, userId);
        for (Object[] row : rows) {
            String chatId = (String) row[0];
            Long count = (Long) row[1];
            result.put(chatId, count);
        }
        return result;
    }

    public void markChatAsRead(String chatId, String userId) {
        List<Message> unread = messageRepository.findUnreadByChatAndUser(chatId, userId);
        if (unread.isEmpty()) return;
        List<String> ids = new ArrayList<>();
        for (Message m : unread) {
            m.setRead(true);
            m.setSeenAt(LocalDateTime.now());
            ids.add(m.getId());
        }
        messageRepository.saveAll(unread);
        messagingTemplate.convertAndSend("/topic/message-read/" + chatId, java.util.Map.of("messageIds", ids));
    }

    public void deleteMessage(String messageId, String deleteType, String userId) {
        Optional<Message> msgOpt = messageRepository.findById(messageId);
        if (msgOpt.isEmpty()) return;
        Message message = msgOpt.get();
        Chat chat = message.getChat();

        if ("everyone".equalsIgnoreCase(deleteType)) {
            messageRepository.delete(message);

            if (chat != null && chat.getLatestMessage() != null && messageId.equals(chat.getLatestMessage().getId())) {
                List<Message> remaining = messageRepository.findByChatIdOrderByCreatedAtAsc(chat.getId());
                if (!remaining.isEmpty()) {
                    chat.setLatestMessage(remaining.get(remaining.size() - 1));
                } else {
                    chat.setLatestMessage(null);
                }
                chatRepository.save(chat);
            }

            java.util.Map<String, Object> delPayload = new java.util.HashMap<>();
            delPayload.put("messageId", messageId);
            delPayload.put("chatId", chat != null ? chat.getId() : null);
            delPayload.put("deleteType", "everyone");

            if (chat != null) {
                try {
                    messagingTemplate.convertAndSend("/topic/message-deleted/" + chat.getId(), delPayload);
                    messagingTemplate.convertAndSend("/topic/chat/" + chat.getId(), delPayload);
                    messagingTemplate.convertAndSend("/topic/conversations/" + chat.getId(), delPayload);
                } catch (Exception e) {}
            }
        }
    }

}

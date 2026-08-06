package com.chitchat.backend.service;

import com.chitchat.backend.model.Chat;
import com.chitchat.backend.model.Message;
import com.chitchat.backend.model.User;
import com.chitchat.backend.repository.ChatRepository;
import com.chitchat.backend.repository.MessageRepository;
import com.chitchat.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Manages WebSocket-first messaging with write-behind buffering.
 * Messages are broadcast instantly over Socket.IO and persisted to DB:
 *  - immediately when the buffer reaches 10 messages, OR
 *  - every 5 seconds via scheduled flush, OR
 *  - when the sender disconnects.
 */
@Service
public class WebSocketMessageBuffer {

    // clientId -> list of pending Message objects to persist
    private final Map<String, CopyOnWriteArrayList<Message>> pendingByClient = new ConcurrentHashMap<>();

    // A raw payload queue: clientId -> list of raw data maps (before we look up User/Chat)
    private final Map<String, List<PendingPayload>> rawPending = new ConcurrentHashMap<>();

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private UserRepository userRepository;

    // ── Called from SocketIOServerConfig when a message arrives over WebSocket ──
    public Message bufferAndBroadcast(String senderId, String chatId, String content) {
        User sender = userRepository.findById(senderId).orElseThrow(() -> new RuntimeException("User not found"));
        Chat chat = chatRepository.findById(chatId).orElseThrow(() -> new RuntimeException("Chat not found"));

        Message message = Message.builder()
                .sender(sender)
                .content(content)
                .chat(chat)
                .build();

        // Add to in-memory buffer keyed by senderId
        pendingByClient.computeIfAbsent(senderId, k -> new CopyOnWriteArrayList<>()).add(message);

        // Auto-flush if buffer for this sender is large
        if (pendingByClient.get(senderId).size() >= 10) {
            flushForClient(senderId);
        }

        return message;
    }

    // ── Flush all buffered messages for a specific client to DB ────────────────
    @Transactional
    public synchronized void flushForClient(String clientId) {
        CopyOnWriteArrayList<Message> buffer = pendingByClient.remove(clientId);
        if (buffer == null || buffer.isEmpty()) return;

        List<Message> toSave = new ArrayList<>(buffer);
        List<Message> saved = messageRepository.saveAll(toSave);

        // Update latestMessage on each chat
        saved.forEach(msg -> {
            Chat chat = msg.getChat();
            chat.setLatestMessage(msg);
            chatRepository.save(chat);
        });

        System.out.println("💾 Flushed " + saved.size() + " buffered messages to DB for client: " + clientId);
    }

    // ── Flush ALL pending messages (called on scheduled interval or shutdown) ───
    @Transactional
    public synchronized void flushAll() {
        if (pendingByClient.isEmpty()) return;
        pendingByClient.keySet().forEach(this::flushForClient);
    }

    public boolean hasPending(String clientId) {
        CopyOnWriteArrayList<Message> buf = pendingByClient.get(clientId);
        return buf != null && !buf.isEmpty();
    }

    // ── Inner record for raw payload before user/chat lookup ─────────────────
    public record PendingPayload(String senderId, String chatId, String content) {}
}

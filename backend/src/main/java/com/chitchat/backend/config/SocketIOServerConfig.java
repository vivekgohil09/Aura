package com.chitchat.backend.config;

import com.chitchat.backend.security.JwtProvider;
import com.chitchat.backend.service.WebSocketMessageBuffer;
import com.corundumstudio.socketio.SocketIOServer;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import java.net.ServerSocket;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
@EnableScheduling
public class SocketIOServerConfig {

    private SocketIOServer server;

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private WebSocketMessageBuffer messageBuffer;

    @Autowired
    private com.chitchat.backend.service.UserService userService;

    // Maps Socket.IO client session ID → app user ID (from JWT)
    private final Map<String, String> sessionToUserId = new ConcurrentHashMap<>();

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setHostname("0.0.0.0");
        config.setPort(9092);
        config.setOrigin("*");

        server = new SocketIOServer(config);

        // ── User setup: join personal room and map session → userId ─────────
        server.addEventListener("setup", Object.class, (client, data, ackSender) -> {
            if (data instanceof Map<?, ?> map) {
                Object tokenObj = map.get("token");
                Object idObj    = map.get("_id");
                String userId   = idObj != null ? idObj.toString() : null;

                // Prefer JWT extraction if token present
                if (tokenObj != null) {
                    try {
                        String extracted = jwtProvider.getUserIdFromJwt(tokenObj.toString());
                        if (extracted != null) userId = extracted;
                    } catch (Exception ignored) {}
                }

                if (userId != null) {
                    sessionToUserId.put(client.getSessionId().toString(), userId);
                    client.joinRoom("user_" + userId);
                    userService.updateOnlineStatus(userId, true);
                    server.getBroadcastOperations().sendEvent("user status change", Map.of(
                        "userId", userId,
                        "isOnline", true,
                        "lastSeen", ""
                    ));
                    System.out.println("✅ User " + userId + " connected via socket");
                }
            }
        });

        // ── Join a chat room ────────────────────────────────────────────────
        server.addEventListener("join chat", Object.class, (client, room, ackSender) -> {
            if (room != null) {
                client.joinRoom(room.toString());
            }
        });

        // ── SEND MESSAGE via WebSocket (write-behind to DB) ─────────────────
        server.addEventListener("send-message", Object.class, (client, data, ackSender) -> {
            if (!(data instanceof Map<?, ?> map)) return;

            String token   = map.containsKey("token")   ? map.get("token").toString()   : null;
            String chatId  = map.containsKey("chatId")  ? map.get("chatId").toString()  : null;
            String content = map.containsKey("content") ? map.get("content").toString() : null;

            if (chatId == null || content == null || content.isBlank()) return;

            // Resolve sender from JWT token
            String senderId = sessionToUserId.get(client.getSessionId().toString());
            if (senderId == null && token != null) {
                try { senderId = jwtProvider.getUserIdFromJwt(token); } catch (Exception ignored) {}
            }
            if (senderId == null) return;

            try {
                // 1. Buffer message in memory (persist lazily)
                var message = messageBuffer.bufferAndBroadcast(senderId, chatId, content);

                // 2. Broadcast to all clients in the chat room INSTANTLY
                server.getRoomOperations(chatId).sendEvent("message received", Map.of(
                    "_id",      "tmp-" + System.currentTimeMillis(),
                    "content",  message.getContent(),
                    "sender",   Map.of("_id", senderId),
                    "chat",     Map.of("_id", chatId, "id", chatId),
                    "chatId",   chatId,
                    "createdAt", java.time.LocalDateTime.now().toString()
                ));
            } catch (Exception e) {
                System.err.println("⚠️ Error buffering message: " + e.getMessage());
            }
        });

        // ── Legacy: "new message" event still supported (REST path) ────────
        server.addEventListener("new message", Object.class, (client, data, ackSender) -> {
            server.getBroadcastOperations().sendEvent("message received", data);
        });

        // ── Typing indicators ───────────────────────────────────────────────
        server.addEventListener("typing", Object.class, (client, data, ackSender) -> {
            server.getBroadcastOperations().sendEvent("typing", data);
        });

        server.addEventListener("stop typing", Object.class, (client, data, ackSender) -> {
            server.getBroadcastOperations().sendEvent("stop typing", data);
        });

        // ── Call signalling ─────────────────────────────────────────────────
        server.addEventListener("call-user", Object.class, (client, data, ackSender) -> {
            server.getBroadcastOperations().sendEvent("call-user", data);
        });

        server.addEventListener("accept-call", Object.class, (client, data, ackSender) -> {
            server.getBroadcastOperations().sendEvent("accept-call", data);
        });

        server.addEventListener("end-call", Object.class, (client, data, ackSender) -> {
            server.getBroadcastOperations().sendEvent("end-call", data);
        });

        // ── Direct Browser Close / Unload Event ─────────────────────────────
        server.addEventListener("leave-app", Object.class, (client, data, ackSender) -> {
            String sessionId = client.getSessionId().toString();
            String userId    = sessionToUserId.remove(sessionId);
            if (userId != null) {
                if (messageBuffer.hasPending(userId)) {
                    messageBuffer.flushForClient(userId);
                }
                if (!sessionToUserId.containsValue(userId)) {
                    var updatedUser = userService.updateOnlineStatus(userId, false);
                    String lastSeenStr = (updatedUser != null && updatedUser.getLastSeen() != null)
                            ? updatedUser.getLastSeen().toString()
                            : java.time.LocalDateTime.now().toString();
                    server.getBroadcastOperations().sendEvent("user status change", Map.of(
                        "userId", userId,
                        "isOnline", false,
                        "lastSeen", lastSeenStr
                    ));
                }
            }
        });

        // ── On disconnect: flush all pending messages for this user ─────────
        server.addDisconnectListener(client -> {
            String sessionId = client.getSessionId().toString();
            String userId    = sessionToUserId.remove(sessionId);
            if (userId != null) {
                if (messageBuffer.hasPending(userId)) {
                    System.out.println("👋 User " + userId + " disconnected — flushing buffered messages…");
                    messageBuffer.flushForClient(userId);
                }
                if (!sessionToUserId.containsValue(userId)) {
                    var updatedUser = userService.updateOnlineStatus(userId, false);
                    String lastSeenStr = (updatedUser != null && updatedUser.getLastSeen() != null)
                            ? updatedUser.getLastSeen().toString()
                            : java.time.LocalDateTime.now().toString();
                    server.getBroadcastOperations().sendEvent("user status change", Map.of(
                        "userId", userId,
                        "isOnline", false,
                        "lastSeen", lastSeenStr
                    ));
                }
            }
        });

        if (isPortAvailable(9092)) {
            try {
                server.start();
                System.out.println("🚀 Native Netty Socket.IO Server started on port 9092 (WebSocket-first messaging)");
            } catch (Exception e) {
                System.err.println("⚠️ Could not start Netty Socket.IO server: " + e.getMessage());
            }
        } else {
            System.out.println("ℹ️ Netty Socket.IO Server port 9092 already active.");
        }

        return server;
    }

    // ── Scheduled flush every 5 seconds (safety net for lost disconnects) ───
    @Scheduled(fixedDelay = 5000)
    public void scheduledFlush() {
        messageBuffer.flushAll();
    }

    private boolean isPortAvailable(int port) {
        try (ServerSocket ss = new ServerSocket(port)) {
            ss.setReuseAddress(true);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @PreDestroy
    public void stopSocketIOServer() {
        System.out.println("🛑 Shutting down — flushing all buffered messages to DB…");
        messageBuffer.flushAll();
        if (server != null) {
            try { server.stop(); } catch (Exception ignored) {}
        }
    }
}

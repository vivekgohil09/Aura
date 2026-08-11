package com.chitchat.backend.config;

import com.chitchat.backend.model.User;
import com.chitchat.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

@Component
public class StompEventListener {

    private final java.util.concurrent.ConcurrentMap<String, String> sessionUsers = new java.util.concurrent.ConcurrentHashMap<>();

    @Autowired
    private UserService userService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleSessionConnected(SessionConnectEvent event) {
        try {
            StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
            Object userObj = accessor.getUser();
            if (userObj instanceof UsernamePasswordAuthenticationToken auth) {
                Object principal = auth.getPrincipal();
                if (principal instanceof User user) {
                    String sessionId = accessor.getSessionId();
                    if (sessionId != null) {
                        sessionUsers.put(sessionId, user.getId());
                    }
                    userService.updateOnlineStatus(user.getId(), true);
                    java.util.Map<String, Object> presence = new java.util.HashMap<>();
                    presence.put("userId", user.getId());
                    presence.put("isOnline", true);
                    presence.put("lastSeen", null);
                    messagingTemplate.convertAndSend("/topic/presence", presence);
                }
            }
        } catch (Exception ignored) {}
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        try {
            StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
            Object userObj = accessor.getUser();
            String sessionId = accessor.getSessionId();
            String disconnectedUserId = sessionId != null ? sessionUsers.remove(sessionId) : null;
            if (userObj instanceof UsernamePasswordAuthenticationToken auth) {
                Object principal = auth.getPrincipal();
                if (principal instanceof User user) {
                    String userId = disconnectedUserId != null ? disconnectedUserId : user.getId();
                    if (sessionUsers.containsValue(userId)) {
                        return;
                    }
                    var updated = userService.updateOnlineStatus(userId, false);
                    Long lastSeenEpoch = null;
                    try {
                        if (updated != null && updated.getLastSeen() != null) {
                            java.time.LocalDateTime ls = updated.getLastSeen();
                            java.time.ZoneId zid = java.time.ZoneId.systemDefault();
                            lastSeenEpoch = ls.atZone(zid).toInstant().toEpochMilli();
                        } else {
                            lastSeenEpoch = java.time.Instant.now().toEpochMilli();
                        }
                    } catch (Exception e) {
                        lastSeenEpoch = java.time.Instant.now().toEpochMilli();
                    }
                    messagingTemplate.convertAndSend("/topic/presence", java.util.Map.of(
                            "userId", userId,
                            "isOnline", false,
                            "lastSeen", lastSeenEpoch
                    ));
                }
            } else if (disconnectedUserId != null) {
                if (sessionUsers.containsValue(disconnectedUserId)) {
                    return;
                }
                var updated = userService.updateOnlineStatus(disconnectedUserId, false);
                Long lastSeenEpoch = updated != null && updated.getLastSeen() != null
                        ? updated.getLastSeen().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli()
                        : java.time.Instant.now().toEpochMilli();
                messagingTemplate.convertAndSend("/topic/presence", java.util.Map.of(
                        "userId", disconnectedUserId,
                        "isOnline", false,
                        "lastSeen", lastSeenEpoch
                ));
            }
        } catch (Exception ignored) {}
    }
}

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
                    userService.updateOnlineStatus(user.getId(), true);
                    // Send lastSeen as null when online
                    messagingTemplate.convertAndSend("/topic/presence", java.util.Map.of(
                            "userId", user.getId(),
                            "isOnline", true,
                            "lastSeen", null
                    ));
                }
            }
        } catch (Exception ignored) {}
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        try {
            StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
            Object userObj = accessor.getUser();
            if (userObj instanceof UsernamePasswordAuthenticationToken auth) {
                Object principal = auth.getPrincipal();
                if (principal instanceof User user) {
                    var updated = userService.updateOnlineStatus(user.getId(), false);
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
                            "userId", user.getId(),
                            "isOnline", false,
                            "lastSeen", lastSeenEpoch
                    ));
                }
            }
        } catch (Exception ignored) {}
    }
}

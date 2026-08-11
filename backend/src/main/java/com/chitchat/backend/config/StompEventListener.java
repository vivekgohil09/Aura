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
                    messagingTemplate.convertAndSend("/topic/presence", java.util.Map.of(
                            "userId", user.getId(),
                            "isOnline", true,
                            "lastSeen", ""
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
                    String lastSeen = updated != null && updated.getLastSeen() != null ? updated.getLastSeen().toString() : java.time.LocalDateTime.now().toString();
                    messagingTemplate.convertAndSend("/topic/presence", java.util.Map.of(
                            "userId", user.getId(),
                            "isOnline", false,
                            "lastSeen", lastSeen
                    ));
                }
            }
        } catch (Exception ignored) {}
    }
}

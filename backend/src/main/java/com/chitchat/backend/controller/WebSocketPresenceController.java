package com.chitchat.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Map;

@Controller
public class WebSocketPresenceController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/typing")
    public void typing(Map<String, Object> payload) {
        if (payload == null) return;
        Object chatIdObj = payload.get("chatId");
        if (chatIdObj == null) return;
        String chatId = chatIdObj.toString();
        messagingTemplate.convertAndSend("/topic/typing/" + chatId, payload);
    }

    @MessageMapping("/stop-typing")
    public void stopTyping(Map<String, Object> payload) {
        if (payload == null) return;
        Object chatIdObj = payload.get("chatId");
        if (chatIdObj == null) return;
        String chatId = chatIdObj.toString();
        messagingTemplate.convertAndSend("/topic/typing/" + chatId, Map.of("chatId", chatId, "stopped", true));
    }

    @MessageMapping("/message.read")
    public void messageRead(Map<String, Object> payload) {
        if (payload == null) return;
        Object chatIdObj = payload.get("chatId");
        if (chatIdObj == null) return;
        String chatId = chatIdObj.toString();
        messagingTemplate.convertAndSend("/topic/message-read/" + chatId, payload);
    }
}

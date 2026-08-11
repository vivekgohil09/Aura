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

    @Autowired
    private com.chitchat.backend.service.MessageService messageService;

    @MessageMapping("/message.read")
    public void messageRead(Map<String, Object> payload) {
        if (payload == null) return;
        Object chatIdObj = payload.get("chatId");
        if (chatIdObj == null) return;
        String chatId = chatIdObj.toString();

        // Attempt to mark messages as read in DB if messageIds provided
        Object idsObj = payload.get("messageIds");
        Object readerObj = payload.get("readerId");
        try {
            if (idsObj instanceof java.util.List) {
                java.util.List<String> ids = new java.util.ArrayList<>();
                for (Object o : (java.util.List<?>) idsObj) {
                    if (o != null) ids.add(o.toString());
                }
                String readerId = readerObj != null ? readerObj.toString() : null;
                messageService.markMessagesRead(chatId, ids, readerId);
            }
        } catch (Exception e) {
            // swallow to avoid breaking websocket flow
            e.printStackTrace();
        }

        messagingTemplate.convertAndSend("/topic/message-read/" + chatId, payload);
    }
}

package com.chitchat.backend.controller;

import com.chitchat.backend.dto.MessageDto;
import com.chitchat.backend.model.Message;
import com.chitchat.backend.model.User;
import com.chitchat.backend.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/message")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @PostMapping
    public ResponseEntity<Message> sendMessage(
            @RequestBody MessageDto.SendMessageRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(messageService.sendMessage(request, currentUser));
    }

    @GetMapping("/{chatId}")
    public ResponseEntity<List<Message>> allMessages(@PathVariable String chatId) {
        return ResponseEntity.ok(messageService.allMessages(chatId));
    }

    @GetMapping("/unread-counts")
    public ResponseEntity<Map<String, Long>> getUnreadCounts(
            @RequestParam String chatIds,
            @AuthenticationPrincipal User currentUser) {
        List<String> ids = Arrays.asList(chatIds.split(","));
        return ResponseEntity.ok(messageService.getUnreadCounts(ids, currentUser.getId()));
    }

    @PutMapping("/mark-read/{chatId}")
    public ResponseEntity<Void> markChatAsRead(
            @PathVariable String chatId,
            @AuthenticationPrincipal User currentUser) {
        messageService.markChatAsRead(chatId, currentUser.getId());
        return ResponseEntity.ok().build();
    }
}

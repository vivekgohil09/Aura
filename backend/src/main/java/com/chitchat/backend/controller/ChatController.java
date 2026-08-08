package com.chitchat.backend.controller;

import com.chitchat.backend.dto.ChatDto;
import com.chitchat.backend.model.Chat;
import com.chitchat.backend.model.User;
import com.chitchat.backend.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping
    public ResponseEntity<Chat> accessChat(
            @RequestBody ChatDto.AccessChatRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(chatService.accessChat(request.getUserId(), currentUser));
    }

    @GetMapping
    public ResponseEntity<List<Chat>> fetchChats(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(chatService.fetchChats(currentUser));
    }

    @PostMapping("/group")
    public ResponseEntity<Chat> createGroupChat(
            @RequestBody ChatDto.CreateGroupChatRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(chatService.createGroupChat(request, currentUser));
    }

    @PutMapping("/rename")
    public ResponseEntity<Chat> renameGroup(@RequestBody ChatDto.RenameGroupRequest request) {
        return ResponseEntity.ok(chatService.renameGroup(request));
    }

    @PutMapping("/groupadd")
    public ResponseEntity<Chat> addToGroup(@RequestBody ChatDto.GroupMemberRequest request) {
        return ResponseEntity.ok(chatService.addToGroup(request));
    }

    @PutMapping("/group-add")
    public ResponseEntity<Chat> addToGroupAlias(@RequestBody ChatDto.GroupMemberRequest request) {
        return ResponseEntity.ok(chatService.addToGroup(request));
    }

    @PutMapping("/groupremove")
    public ResponseEntity<Chat> removeFromGroup(@RequestBody ChatDto.GroupMemberRequest request) {
        return ResponseEntity.ok(chatService.removeFromGroup(request));
    }

    @PutMapping("/group-remove")
    public ResponseEntity<Chat> removeFromGroupAlias(@RequestBody ChatDto.GroupMemberRequest request) {
        return ResponseEntity.ok(chatService.removeFromGroup(request));
    }

    @DeleteMapping("/{chatId}")
    public ResponseEntity<Void> deleteChat(
            @PathVariable String chatId,
            @AuthenticationPrincipal User currentUser) {
        chatService.deleteChat(chatId, currentUser);
        return ResponseEntity.ok().build();
    }
}

package com.chitchat.backend.controller;

import com.chitchat.backend.dto.CallSignalDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class CallController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/call-user")
    public void callUser(@Payload CallSignalDto signal) {
        // Relay call offer signal to chat topic or specific queue
        if (signal.getChatId() != null) {
            messagingTemplate.convertAndSend("/topic/call/" + signal.getChatId(), signal);
        }
        // Also broadcast to a global call announcements topic so legacy socket-style listeners can receive ringing
        try {
            messagingTemplate.convertAndSend("/topic/call-global", signal);
        } catch (Exception e) {
            // swallow
        }
    }

    @MessageMapping("/answer-call")
    public void answerCall(@Payload CallSignalDto signal) {
        // Relay call answer signal to chat topic
        if (signal.getChatId() != null) {
            messagingTemplate.convertAndSend("/topic/call/" + signal.getChatId(), signal);
        }
        try {
            messagingTemplate.convertAndSend("/topic/call-global", signal);
        } catch (Exception e) {}
    }

    @MessageMapping("/ice-candidate")
    public void sendIceCandidate(@Payload CallSignalDto signal) {
        // Relay ICE candidate for peer connection establishment
        if (signal.getChatId() != null) {
            messagingTemplate.convertAndSend("/topic/call/" + signal.getChatId(), signal);
        }
    }

    @MessageMapping("/end-call")
    public void endCall(@Payload CallSignalDto signal) {
        // Relay end call notification to specific chat topic
        if (signal.getChatId() != null) {
            messagingTemplate.convertAndSend("/topic/call/" + signal.getChatId(), signal);
        }
        // Also broadcast globally so active ringtones and incoming call modals close immediately
        try {
            messagingTemplate.convertAndSend("/topic/call-global", signal);
        } catch (Exception e) {
            // swallow
        }
    }
}

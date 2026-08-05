package com.chitchat.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CallSignalDto {
    private String type; // "call-user", "make-answer", "ice-candidate", "end-call", "call-accepted", "call-rejected"
    private String chatId;
    private String fromUser;
    private String toUser;
    private Object signalData; // WebRTC offer/answer SDP or ICE candidate payload
}

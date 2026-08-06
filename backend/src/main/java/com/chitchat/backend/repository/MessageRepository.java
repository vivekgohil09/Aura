package com.chitchat.backend.repository;

import com.chitchat.backend.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {

    List<Message> findByChatIdOrderByCreatedAtAsc(String chatId);

    java.util.Optional<Message> findByClientMessageId(String clientMessageId);
}

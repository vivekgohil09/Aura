package com.chitchat.backend.repository;

import com.chitchat.backend.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {

    List<Message> findByChatIdOrderByCreatedAtAsc(String chatId);

    java.util.Optional<Message> findByClientMessageId(String clientMessageId);

    @Query("SELECT m.chat.id, COUNT(m) FROM Message m WHERE m.chat.id IN :chatIds AND m.sender.id <> :userId AND m.isRead = false GROUP BY m.chat.id")
    List<Object[]> countUnreadByChatIds(@Param("chatIds") List<String> chatIds, @Param("userId") String userId);

    @Query("SELECT m FROM Message m WHERE m.chat.id = :chatId AND m.sender.id <> :userId AND m.isRead = false")
    List<Message> findUnreadByChatAndUser(@Param("chatId") String chatId, @Param("userId") String userId);
}

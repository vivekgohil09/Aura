package com.chitchat.backend.repository;

import com.chitchat.backend.model.Chat;
import com.chitchat.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends JpaRepository<Chat, String> {

    @Query("SELECT c FROM Chat c JOIN c.users u WHERE u.id = :userId ORDER BY c.updatedAt DESC")
    List<Chat> findChatsByUserId(@Param("userId") String userId);

    @Query("SELECT c FROM Chat c WHERE c.isGroupChat = false AND :user1 MEMBER OF c.users AND :user2 MEMBER OF c.users")
    List<Chat> findSingleChatByUsers(@Param("user1") User user1, @Param("user2") User user2);
}

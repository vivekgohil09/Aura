package com.chitchat.backend.repository;

import com.chitchat.backend.model.ChatRequest;
import com.chitchat.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRequestRepository extends JpaRepository<ChatRequest, String> {
    List<ChatRequest> findByReceiverAndStatus(User receiver, String status);
    Optional<ChatRequest> findBySenderAndReceiverAndStatus(User sender, User receiver, String status);
}

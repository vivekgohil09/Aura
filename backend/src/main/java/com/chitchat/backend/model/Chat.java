package com.chitchat.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "chats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Chat {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String chatName;

    private boolean isGroupChat = false;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "chat_users",
        joinColumns = @JoinColumn(name = "chat_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private Set<User> users = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "latest_message_id")
    @JsonIgnoreProperties("chat")
    private Message latestMessage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_admin_id")
    private User groupAdmin;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String get_id() {
        return id;
    }
}

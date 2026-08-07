package com.chitchat.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String pic = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    @Column(name = "USERNAME", nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false)
    private boolean isAdmin = false;

    @Column(name = "IS_ONLINE")
    private boolean isOnline = false;

    @Column(name = "LAST_SEEN")
    private LocalDateTime lastSeen;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (pic == null || pic.trim().isEmpty()) {
            pic = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        }
        if (username == null || username.trim().isEmpty()) {
            if (email != null && email.contains("@")) {
                username = email.split("@")[0].replaceAll("[^a-z0-9_.]", "").toLowerCase();
            } else if (name != null) {
                username = name.replaceAll("[^a-z0-9_.]", "").toLowerCase();
            } else {
                username = "user_" + System.currentTimeMillis();
            }
        }
        if (username.startsWith("@")) {
            username = username.substring(1);
        }
        username = username.toLowerCase().trim();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String get_id() {
        return id;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return id != null && id.equals(user.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}

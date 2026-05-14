package com.StarsFighters.StarsFighters.Models;

import com.StarsFighters.StarsFighters.Models.Entities.Friendship;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;
@Entity
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn( name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne
    @JoinColumn( name = "friendship_id", nullable = false)
    private Friendship friendship;
    private String content;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
    }

    public Friendship getFriendship() {
        return friendship;
    }

    public void setFriendship(Friendship friendship) {
        this.friendship = friendship;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
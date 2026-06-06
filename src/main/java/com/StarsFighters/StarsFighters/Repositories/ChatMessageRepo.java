package com.StarsFighters.StarsFighters.Repositories;

import com.StarsFighters.StarsFighters.Models.Entities.ChatMessage;
import com.StarsFighters.StarsFighters.Models.Entities.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepo extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByFriendshipOrderByCreatedAtAsc(Friendship friendship);
    List<ChatMessage> findByFriendshipId(Long friendshipId);
}
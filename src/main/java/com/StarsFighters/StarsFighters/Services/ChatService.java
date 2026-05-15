package com.StarsFighters.StarsFighters.Services;

import com.StarsFighters.StarsFighters.Models.ChatMessage;
import com.StarsFighters.StarsFighters.Models.Dto.ChatMessageDto;
import com.StarsFighters.StarsFighters.Models.Entities.Friendship;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Repositories.ChatMessageRepo;
import com.StarsFighters.StarsFighters.Repositories.FriendshipRepo;
import com.StarsFighters.StarsFighters.Repositories.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired
    private ChatMessageRepo chatMessageRepo;

    @Autowired
    private FriendshipRepo friendshipRepo;

    @Autowired
    private UserRepo userRepo;

    public ChatMessageDto saveMessage(String senderUsername, Long friendshipId, String content) {
        User sender = userRepo.findByUsername(senderUsername).orElseThrow();
        Friendship friendship = friendshipRepo.findById(friendshipId).orElseThrow();

        ChatMessage message = new ChatMessage();
        message.setSender(sender);
        message.setFriendship(friendship);
        message.setContent(content);

        ChatMessage saved = chatMessageRepo.save(message);

        return new ChatMessageDto(
                saved.getId(),
                sender.getId(),
                sender.getUsername(),
                friendship.getId(),
                saved.getContent(),
                saved.getCreatedAt()
        );
    }

    public List<ChatMessageDto> getChatHistory(Long friendshipId) {
        Friendship friendship = friendshipRepo.findById(friendshipId).orElseThrow();
        return chatMessageRepo.findByFriendshipOrderByCreatedAtAsc(friendship).stream()
                .map(m -> new ChatMessageDto(
                        m.getId(),
                        m.getSender().getId(),
                        m.getSender().getUsername(),
                        m.getFriendship().getId(),
                        m.getContent(),
                        m.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }
}
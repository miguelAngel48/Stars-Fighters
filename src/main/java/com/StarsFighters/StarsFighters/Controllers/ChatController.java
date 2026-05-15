package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Models.Dto.ChatMessageDto;
import com.StarsFighters.StarsFighters.Models.Dto.ChatRequestDto;
import com.StarsFighters.StarsFighters.Services.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatService chatService;

    @MessageMapping("/chat.private")
    public void sendPrivateMessage(@Payload ChatRequestDto message, Principal principal) {
        ChatMessageDto savedMessage = chatService.saveMessage(principal.getName(), message.friendshipId(), message.content());

        messagingTemplate.convertAndSendToUser(
                message.receiverUsername(),
                "/queue/messages",
                savedMessage
        );

        messagingTemplate.convertAndSendToUser(
                principal.getName(),
                "/queue/messages",
                savedMessage
        );
    }

    @GetMapping("/api/chat/{friendshipId}")
    public ResponseEntity<List<ChatMessageDto>> getHistory(@PathVariable Long friendshipId) {
        return ResponseEntity.ok(chatService.getChatHistory(friendshipId));
    }
}
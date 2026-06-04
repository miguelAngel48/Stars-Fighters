package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Models.Dto.GameSyncDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class GameSyncController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/game.sync")
    public void syncGame(GameSyncDto syncDto) {
        messagingTemplate.convertAndSendToUser(
                syncDto.targetUsername(),
                "/queue/game-sync",
                syncDto
        );
    }

    @MessageMapping("/game.hit")
    public void handleGameHit(java.util.Map<String, Object> payload, java.security.Principal principal) {
        String targetUsername = (String) payload.get("targetUsername");


        messagingTemplate.convertAndSendToUser(
                targetUsername,
                "/queue/game-hit",
                payload
        );
    }
    @MessageMapping("/game.death")
    public void handleGameDeath(@org.springframework.messaging.handler.annotation.Payload java.util.Map<String, Object> payload) {
        String targetUsername = (String) payload.get("targetUsername");


        messagingTemplate.convertAndSendToUser(
                targetUsername,
                "/queue/game-death",
                payload
        );
    }
}
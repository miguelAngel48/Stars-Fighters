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
}
package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Models.Dto.GameSyncDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class GameSyncController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public static final Map<String, String> activePlayersOpponents = new ConcurrentHashMap<>();

    @MessageMapping("/game.sync")
    public void syncGame(@Payload GameSyncDto syncDto, Principal principal) {
        if (principal != null) {
            // Guardamos directamente el nombre exacto de la sesión para evitar fallos de mayúsculas
            activePlayersOpponents.put(principal.getName(), syncDto.targetUsername());
        }
        messagingTemplate.convertAndSendToUser(
                syncDto.targetUsername(),
                "/queue/game-sync",
                syncDto
        );
    }

    @MessageMapping("/game.hit")
    public void handleGameHit(@Payload Map<String, Object> payload) {
        String targetUsername = (String) payload.get("targetUsername");
        messagingTemplate.convertAndSendToUser(
                targetUsername,
                "/queue/game-hit",
                payload
        );
    }

    @MessageMapping("/game.death")
    public void handleGameDeath(@Payload Map<String, Object> payload) {
        String targetUsername = (String) payload.get("targetUsername");
        messagingTemplate.convertAndSendToUser(
                targetUsername,
                "/queue/game-death",
                payload
        );
    }

    @MessageMapping("/game.leave")
    public void handleGameLeave(@Payload Map<String, Object> payload, Principal principal) {
        String targetUsername = (String) payload.get("targetUsername");
        if (principal != null) {
            activePlayersOpponents.remove(principal.getName());
            messagingTemplate.convertAndSendToUser(
                    targetUsername,
                    "/queue/game-opponent-left",
                    Map.of("leaver", principal.getName())
            );
        }
    }
}
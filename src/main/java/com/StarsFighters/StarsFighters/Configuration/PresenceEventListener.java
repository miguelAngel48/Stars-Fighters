package com.StarsFighters.StarsFighters.Configuration;

import com.StarsFighters.StarsFighters.Controllers.GameSyncController;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Repositories.UserRepo;
import com.StarsFighters.StarsFighters.Services.FriendshipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;

@Component
public class PresenceEventListener {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private FriendshipService friendshipService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        Principal principal = event.getUser();
        if (principal != null) {
            updatePresence(principal.getName(), true);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        Principal principal = event.getUser();
        if (principal != null) {
            String username = principal.getName();
            updatePresence(username, false);

            // Avisar al oponente si estábamos en partida
            String opponent = GameSyncController.activePlayersOpponents.get(username);
            if (opponent != null) {
                messagingTemplate.convertAndSendToUser(
                        opponent,
                        "/queue/game-opponent-left",
                        Map.of("leaver", username)
                );
                GameSyncController.activePlayersOpponents.remove(username);
            }
        }
    }

    private void updatePresence(String username, boolean isOnline) {
        userRepo.findByUsername(username).ifPresent(user -> {
            user.setOnline(isOnline);
            userRepo.save(user);

            String currentStatus = "OFFLINE";
            if (isOnline) {
                if ("ACTIVE".equals(user.getStatusPreference())) {
                    currentStatus = "ONLINE";
                } else if ("DND".equals(user.getStatusPreference())) {
                    currentStatus = "DND";
                } else if ("INVISIBLE".equals(user.getStatusPreference())) {
                    currentStatus = "OFFLINE";
                }
            }

            Map<String, Object> presenceMsg = Map.of(
                    "type", "PRESENCE",
                    "username", username,
                    "status", currentStatus
            );

            friendshipService.getAcceptedFriends(username).forEach(friend -> {
                messagingTemplate.convertAndSendToUser(
                        friend.username(),
                        "/queue/notifications",
                        presenceMsg
                );
            });
        });
    }
}
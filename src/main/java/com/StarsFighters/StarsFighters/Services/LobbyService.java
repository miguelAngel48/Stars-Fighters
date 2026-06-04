package com.StarsFighters.StarsFighters.Services;

import com.StarsFighters.StarsFighters.Models.Dto.GameInviteDto;
import com.StarsFighters.StarsFighters.Models.Dto.GameStartDto;
import com.StarsFighters.StarsFighters.Models.Dto.SelectionDto;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Repositories.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class LobbyService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public String sendGameInvite(Long leaderId, Long friendId) {
        User leader = userRepo.findById(leaderId)
                .orElseThrow(() -> new RuntimeException("Líder no encontrado"));
        User friend = userRepo.findById(friendId)
                .orElseThrow(() -> new RuntimeException("Amigo no encontrado"));

        String lobbyId = UUID.randomUUID().toString();

        GameInviteDto invite = new GameInviteDto(
                "GAME_INVITE",
                leader.getId(),
                leader.getUsername(),
                lobbyId,
                leader.getEquippedAvatarUrl()
        );

        messagingTemplate.convertAndSendToUser(
                friend.getUsername(),
                "/queue/notifications",
                invite
        );
        return lobbyId;
    }

    public void respondToInvite(Long friendId, Long leaderId, boolean accepted, String lobbyId) {
        User friend = userRepo.findById(friendId).orElseThrow();
        User leader = userRepo.findById(leaderId).orElseThrow();

        GameInviteDto response = new GameInviteDto(
                accepted ? "GAME_ACCEPTED" : "GAME_REJECTED",
                friend.getId(),
                friend.getUsername(),
                lobbyId,
                friend.getEquippedAvatarUrl()
        );

        messagingTemplate.convertAndSendToUser(
                leader.getUsername(),
                "/queue/notifications",
                response
        );
    }
    public void notifyLeave(Long myId, String targetUsername, String lobbyId, boolean isLeader) {
        User me = userRepo.findById(myId).orElseThrow();

        String type = isLeader ? "LOBBY_CLOSED" : "GUEST_LEFT";

        GameInviteDto leaveMsg = new GameInviteDto(
                type,
                me.getId(),
                me.getUsername(),
                lobbyId,
                me.getEquippedAvatarUrl()
        );

        messagingTemplate.convertAndSendToUser(
                targetUsername,
                "/queue/notifications",
                leaveMsg
        );
    }
    public void kickPlayer(Long leaderId, String guestUsername, String lobbyId) {
        User leader = userRepo.findById(leaderId).orElseThrow();

        GameInviteDto kickMsg = new GameInviteDto(
                "GUEST_KICKED",
                leader.getId(),
                leader.getUsername(),
                lobbyId,
                leader.getEquippedAvatarUrl()
        );

        messagingTemplate.convertAndSendToUser(
                guestUsername,
                "/queue/notifications",
                kickMsg
        );
    }

    public void startCharacterSelection(Long leaderId, String guestUsername, String lobbyId) {
        GameInviteDto startMsg = new GameInviteDto(
                "START_SELECTION",
                leaderId,
                "Líder",
                lobbyId,
                null
        );

        messagingTemplate.convertAndSendToUser(
                guestUsername,
                "/queue/notifications",
                startMsg
        );
    }

    private final java.util.Map<String, java.util.Map<String, Object>> activeMatches = new java.util.concurrent.ConcurrentHashMap<>();

    public void submitSelection(String lobbyId, String role, Long characterId, String characterName, Long mapId, String myUsername, String targetUsername) {

        activeMatches.putIfAbsent(lobbyId, new java.util.concurrent.ConcurrentHashMap<>());
        java.util.Map<String, Object> matchData = activeMatches.get(lobbyId);

        matchData.put(role + "CharId", characterId);
        matchData.put(role + "CharName", characterName);
        matchData.put(role + "Username", myUsername);
        if (mapId != null) {
            matchData.put("mapId", mapId);
        }

        SelectionDto readyNotice = new SelectionDto(
                "OPPONENT_READY",
                role,
                characterId,
                characterName,
                mapId,
                lobbyId
        );
        messagingTemplate.convertAndSendToUser(targetUsername, "/queue/notifications", readyNotice);

        if (matchData.containsKey("leaderCharId") && matchData.containsKey("guestCharId")) {
            Long finalMapId = (Long) matchData.getOrDefault("mapId", 1L);
            Long leaderCharId = (Long) matchData.get("leaderCharId");
            Long guestCharId = (Long) matchData.get("guestCharId");

            GameStartDto startGameMsg = new GameStartDto(
                    "START_GAME",
                    finalMapId,
                    leaderCharId,
                    guestCharId,
                    lobbyId
            );

            messagingTemplate.convertAndSendToUser((String) matchData.get("leaderUsername"), "/queue/notifications", startGameMsg);
            messagingTemplate.convertAndSendToUser((String) matchData.get("guestUsername"), "/queue/notifications", startGameMsg);

            activeMatches.remove(lobbyId);
        }
    }
}
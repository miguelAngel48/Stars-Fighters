package com.StarsFighters.StarsFighters.Services;

import com.StarsFighters.StarsFighters.Models.Dto.GameInviteDto;
import com.StarsFighters.StarsFighters.Models.Dto.GameStartDto;
import com.StarsFighters.StarsFighters.Models.Dto.SelectionDto;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Repositories.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Queue;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;

@Service
public class LobbyService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private UserService userService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final Queue<Long> matchmakingQueue = new ConcurrentLinkedQueue<>();
    private final java.util.Map<String, java.util.Map<String, Object>> activeMatches = new java.util.concurrent.ConcurrentHashMap<>();
    private final java.util.Map<String, java.util.Map<String, Object>> lobbySettings = new java.util.concurrent.ConcurrentHashMap<>();

    public void joinMatchmaking(Long userId) {
        if (matchmakingQueue.contains(userId)) return;

        Long waitingUserId = matchmakingQueue.poll();
        if (waitingUserId != null && !waitingUserId.equals(userId)) {
            User player1 = userRepo.findById(waitingUserId).orElseThrow();
            User player2 = userRepo.findById(userId).orElseThrow();
            String lobbyId = UUID.randomUUID().toString();

            java.util.Map<String, Object> settings = new java.util.concurrent.ConcurrentHashMap<>();
            settings.put("mode", "normal");
            settings.put("timeLimit", 180);
            settings.put("lives", 5);
            lobbySettings.put(lobbyId, settings);

            GameInviteDto p1Msg = new GameInviteDto(
                    "MATCH_FOUND_LEADER",
                    player2.getId(),
                    player2.getUsername(),
                    lobbyId,
                    player2.getEquippedAvatarUrl()
            );
            messagingTemplate.convertAndSendToUser(player1.getUsername(), "/queue/notifications", p1Msg);

            GameInviteDto p2Msg = new GameInviteDto(
                    "MATCH_FOUND_GUEST",
                    player1.getId(),
                    player1.getUsername(),
                    lobbyId,
                    player1.getEquippedAvatarUrl()
            );
            messagingTemplate.convertAndSendToUser(player2.getUsername(), "/queue/notifications", p2Msg);
        } else {
            matchmakingQueue.add(userId);
        }
    }

    public void leaveMatchmaking(Long userId) {
        matchmakingQueue.remove(userId);
    }

    public String sendGameInvite(Long leaderId, Long friendId) {
        User leader = userRepo.findById(leaderId).orElseThrow();
        User friend = userRepo.findById(friendId).orElseThrow();

        String lobbyId = UUID.randomUUID().toString();

        java.util.Map<String, Object> settings = new java.util.concurrent.ConcurrentHashMap<>();
        settings.put("mode", "custom");
        settings.put("timeLimit", 180);
        settings.put("lives", 5);
        lobbySettings.put(lobbyId, settings);

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

    public void updateLobbySettings(String lobbyId, int timeLimit, int lives) {
        java.util.Map<String, Object> settings = lobbySettings.getOrDefault(lobbyId, new java.util.concurrent.ConcurrentHashMap<>());
        settings.put("timeLimit", timeLimit);
        settings.put("lives", lives);
        lobbySettings.put(lobbyId, settings);
    }

    public java.util.Map<String, Object> getLobbySettings(String lobbyId) {
        return lobbySettings.getOrDefault(lobbyId, java.util.Map.of("mode", "custom", "timeLimit", 180, "lives", 5));
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
        User leader = userRepo.findById(leaderId).orElseThrow();

        GameInviteDto startMsg = new GameInviteDto(
                "START_SELECTION",
                leaderId,
                leader.getUsername(),
                lobbyId,
                null
        );

        messagingTemplate.convertAndSendToUser(
                guestUsername,
                "/queue/notifications",
                startMsg
        );
    }

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
            String leaderName = (String) matchData.get("leaderUsername");
            String guestName = (String) matchData.get("guestUsername");

            GameStartDto startGameMsg = new GameStartDto(
                    "START_GAME",
                    finalMapId,
                    leaderCharId,
                    guestCharId,
                    lobbyId
            );

            messagingTemplate.convertAndSendToUser(leaderName, "/queue/notifications", startGameMsg);
            messagingTemplate.convertAndSendToUser(guestName, "/queue/notifications", startGameMsg);

            java.util.Map<String, Object> settings = lobbySettings.get(lobbyId);
            if (settings != null && "normal".equals(settings.get("mode"))) {
                userService.registerNormalMatch(lobbyId, leaderName, guestName);
            }

            activeMatches.remove(lobbyId);
        }
    }
}
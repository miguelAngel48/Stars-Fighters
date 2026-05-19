package com.StarsFighters.StarsFighters.Services;

import com.StarsFighters.StarsFighters.Models.Dto.GameInviteDto;
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
                lobbyId
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
                lobbyId
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
                lobbyId
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
                lobbyId
        );

        messagingTemplate.convertAndSendToUser(
                guestUsername,
                "/queue/notifications",
                kickMsg
        );
    }

}
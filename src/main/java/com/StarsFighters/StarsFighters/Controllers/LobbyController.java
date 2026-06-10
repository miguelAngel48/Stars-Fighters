package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Services.JwtService;
import com.StarsFighters.StarsFighters.Services.LobbyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lobby")
public class LobbyController {

    @Autowired
    private LobbyService lobbyService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/invite/{friendId}")
    public ResponseEntity<?> inviteFriend(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long friendId
    ) {
        try {
            Long leaderId = jwtService.extractId(authHeader.substring(7));
            String lobbyId = lobbyService.sendGameInvite(leaderId, friendId);
            return ResponseEntity.ok(java.util.Map.of("lobbyId", lobbyId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/respond/{leaderId}")
    public ResponseEntity<?> respondToInvite(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long leaderId,
            @RequestParam boolean accepted,
            @RequestParam String lobbyId
    ) {
        try {
            Long friendId = jwtService.extractId(authHeader.substring(7));
            lobbyService.respondToInvite(friendId, leaderId, accepted, lobbyId);
            return ResponseEntity.ok("Respuesta procesada");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/leave")
    public ResponseEntity<?> leaveLobby(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String targetUsername,
            @RequestParam String lobbyId,
            @RequestParam boolean isLeader
    ) {
        try {
            Long myId = jwtService.extractId(authHeader.substring(7));
            lobbyService.notifyLeave(myId, targetUsername, lobbyId, isLeader);
            return ResponseEntity.ok("Notificación enviada");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/kick")
    public ResponseEntity<?> kickPlayer(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String guestUsername,
            @RequestParam String lobbyId
    ) {
        try {
            Long leaderId = jwtService.extractId(authHeader.substring(7));
            lobbyService.kickPlayer(leaderId, guestUsername, lobbyId);
            return ResponseEntity.ok("Jugador expulsado");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/start")
    public ResponseEntity<?> startGame(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String guestUsername,
            @RequestParam String lobbyId
    ) {
        try {
            Long leaderId = jwtService.extractId(authHeader.substring(7));
            lobbyService.startCharacterSelection(leaderId, guestUsername, lobbyId);
            return ResponseEntity.ok("Iniciado");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/ready")
    public ResponseEntity<?> playerReady(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String lobbyId,
            @RequestParam String role,
            @RequestParam Long characterId,
            @RequestParam String characterName,
            @RequestParam(required = false) Long mapId,
            @RequestParam String targetUsername
    ) {
        try {
            String myUsername = jwtService.extractUsername(authHeader.substring(7));
            lobbyService.submitSelection(lobbyId, role, characterId, characterName, mapId, myUsername, targetUsername);
            return ResponseEntity.ok("Selección registrada");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/matchmaking/join")
    public ResponseEntity<?> joinMatchmaking(@RequestHeader("Authorization") String authHeader) {
        try {
            Long myId = jwtService.extractId(authHeader.substring(7));
            lobbyService.joinMatchmaking(myId);
            return ResponseEntity.ok("En cola");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/matchmaking/leave")
    public ResponseEntity<?> leaveMatchmaking(@RequestHeader("Authorization") String authHeader) {
        try {
            Long myId = jwtService.extractId(authHeader.substring(7));
            lobbyService.leaveMatchmaking(myId);
            return ResponseEntity.ok("Fuera de cola");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/settings")
    public ResponseEntity<?> updateSettings(
            @RequestParam String lobbyId,
            @RequestParam int timeLimit,
            @RequestParam int lives) {
        lobbyService.updateLobbySettings(lobbyId, timeLimit, lives);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/settings/{lobbyId}")
    public ResponseEntity<?> getSettings(@PathVariable String lobbyId) {
        return ResponseEntity.ok(lobbyService.getLobbySettings(lobbyId));
    }
}
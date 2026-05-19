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

    // Endpoint para cuando arrastras al amigo
    @PostMapping("/invite/{friendId}")
    public ResponseEntity<?> inviteFriend(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long friendId
    ) {
        try {
            Long leaderId = jwtService.extractId(authHeader.substring(7));
            String lobbyId =  lobbyService.sendGameInvite(leaderId, friendId);
            return ResponseEntity.ok(java.util.Map.of("lobbyId", lobbyId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Endpoint para cuando el amigo pulsa Aceptar/Rechazar
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
            return ResponseEntity.badRequest().body("Error al responder: " + e.getMessage());
        }
    }
    @PostMapping("/leave")
    public ResponseEntity<?> leaveLobby(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String targetUsername, // A quién le vamos a avisar
            @RequestParam String lobbyId,
            @RequestParam boolean isLeader
    ) {
        try {
            Long myId = jwtService.extractId(authHeader.substring(7));
            lobbyService.notifyLeave(myId, targetUsername, lobbyId, isLeader);
            return ResponseEntity.ok("Notificación de salida enviada");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al salir: " + e.getMessage());
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
            return ResponseEntity.ok("Jugador expulsado con éxito");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al expulsar: " + e.getMessage());
        }
    }
}
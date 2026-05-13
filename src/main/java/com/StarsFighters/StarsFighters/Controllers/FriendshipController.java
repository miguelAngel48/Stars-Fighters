package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Models.Dto.FriendRequestDto;
import com.StarsFighters.StarsFighters.Services.FriendshipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/friendships")
public class FriendshipController {

    @Autowired
    FriendshipService friendshipService;
    @GetMapping
    public ResponseEntity<?> getMyFriends(Principal principal) {
        try {
            // Extraemos el nombre de usuario del token de quien hace la petición
            String username = principal.getName();

            // Llamamos al servicio para obtener la lista
            return ResponseEntity.ok(friendshipService.getAcceptedFriends(username));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al obtener la lista de amigos: " + e.getMessage());
        }
    }
    @PostMapping("/request")
    public ResponseEntity<?> sendFriendRequest(@RequestBody FriendRequestDto request, Principal principal) {
        try {
            // 'principal.getName()' contendrá el username o email del jugador autenticado por el JWT
            String senderUsername = principal.getName();
            String receiverFriendCode = request.friendCode();

            // Actualizamos el servicio para que reciba estos nuevos parámetros
            friendshipService.sendFriendRequestByCode(senderUsername, receiverFriendCode);

            return ResponseEntity.status(HttpStatus.CREATED).body("Solicitud de amistad enviada con éxito.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/respond/{requestId}")
    public ResponseEntity<?> respondToRequest(
            @PathVariable Long requestId,
            @RequestParam boolean accepted) {
        try {
            friendshipService.respondToRequest(requestId, accepted);
            String message = accepted ? "Amistad aceptada" : "Amistad rechazada";
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingRequests(Principal principal) {
        try {

            return ResponseEntity.ok(friendshipService.getPendingRequests(principal.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
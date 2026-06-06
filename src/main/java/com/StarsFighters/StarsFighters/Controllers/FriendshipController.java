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
            String username = principal.getName();
            return ResponseEntity.ok(friendshipService.getAcceptedFriends(username));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/request")
    public ResponseEntity<?> sendFriendRequest(@RequestBody FriendRequestDto request, Principal principal) {
        try {
            String senderUsername = principal.getName();
            String receiverFriendCode = request.friendCode();
            friendshipService.sendFriendRequestByCode(senderUsername, receiverFriendCode);
            return ResponseEntity.status(HttpStatus.CREATED).body("Solicitud enviada");
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
            return ResponseEntity.ok(accepted ? "Aceptada" : "Rechazada");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{friendshipId}")
    public ResponseEntity<?> removeFriendship(@PathVariable Long friendshipId, Principal principal) {
        try {
            friendshipService.removeFriendship(friendshipId, principal.getName());
            return ResponseEntity.ok("Amistad cancelada");
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
package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Services.FriendshipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/friendships")
public class FriendshipController {

    @Autowired
    FriendshipService friendshipService;

@PostMapping("/request")
public ResponseEntity<?> sendFriendRequest (@RequestParam Long senderId, Long recieverId){

    try{
        friendshipService.sendFriendRequest(senderId, recieverId);
        return ResponseEntity.status(HttpStatus.CREATED).body("Sended Friend Request");
    } catch (Exception e){
        return  ResponseEntity.badRequest().body(e.getMessage());
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
}

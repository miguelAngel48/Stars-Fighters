package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    @Autowired
    private UserService userService;

    @PostMapping("/record")
    public ResponseEntity<?> recordMatchResult(
            @RequestParam boolean isWinner,
            @RequestParam String lobbyId,
            Principal principal) {
        try {
            Map<String, Object> result = userService.recordMatchResult(principal.getName(), isWinner, lobbyId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<?> getLeaderboard() {
        try {
            return ResponseEntity.ok(userService.getGlobalLeaderboard());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Repositories.UserRepo;
import com.StarsFighters.StarsFighters.Services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private UserService userService;

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam String query, Principal principal) {
        String currentEmail = principal.getName();
        List<User> users = userRepo.findByUsernameContainingIgnoreCase(query);

        List<Map<String, String>> results = users.stream()
                .filter(u -> !u.getEmail().equals(currentEmail))
                .limit(5)
                .map(u -> Map.of("username", u.getUsername(), "friendCode", u.getFriendCode()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    @GetMapping("/avatars")
    public ResponseEntity<?> getOwnedAvatars(Principal principal) {
        try {
            return ResponseEntity.ok(userService.getOwnedAvatars(principal.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/avatar")
    public ResponseEntity<?> updateAvatar(@RequestBody Map<String, String> body, Principal principal) {
        try {
            userService.updateAvatar(principal.getName(), body.get("avatarUrl"));
            return ResponseEntity.ok("Avatar actualizado");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/username")
    public ResponseEntity<?> updateUsername(@RequestBody Map<String, String> body, Principal principal) {
        try {
            userService.updateUsername(principal.getName(), body.get("newUsername"));
            return ResponseEntity.ok("Nombre de usuario actualizado");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/password")
    public ResponseEntity<?> updatePassword(@RequestBody Map<String, String> body, Principal principal) {
        try {
            userService.updatePassword(principal.getName(), body.get("currentPassword"), body.get("newPassword"));
            return ResponseEntity.ok("Contraseña actualizada");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
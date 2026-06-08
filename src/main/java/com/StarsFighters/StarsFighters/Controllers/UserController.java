package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Models.Dto.ApiResponse;
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
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }

    @PutMapping("/avatar")
    public ResponseEntity<?> updateAvatar(@RequestBody Map<String, String> body, Principal principal) {
        try {
            String avatarUrl = body.get("avatarUrl");
            if (avatarUrl == null || avatarUrl.trim().isEmpty() || avatarUrl.contains("<") || avatarUrl.contains(">")) {
                return ResponseEntity.badRequest().body(new ApiResponse("URL de avatar invalida"));
            }
            userService.updateAvatar(principal.getName(), avatarUrl);
            return ResponseEntity.ok(new ApiResponse("Avatar actualizado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }

    @PutMapping("/username")
    public ResponseEntity<?> updateUsername(@RequestBody Map<String, String> body, Principal principal) {
        try {
            String newUsername = body.get("newUsername");
            if (newUsername == null || newUsername.trim().isEmpty() || newUsername.length() < 3 || newUsername.length() > 20) {
                return ResponseEntity.badRequest().body(new ApiResponse("El nombre de usuario debe tener entre 3 y 20 caracteres"));
            }
            if (!newUsername.matches("^[a-zA-Z0-9_]+$")) {
                return ResponseEntity.badRequest().body(new ApiResponse("El nombre de usuario solo puede contener caracteres alfanumericos y guiones bajos"));
            }
            userService.updateUsername(principal.getName(), newUsername);
            return ResponseEntity.ok(new ApiResponse("Nombre de usuario actualizado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }

    @PutMapping("/password")
    public ResponseEntity<?> updatePassword(@RequestBody Map<String, String> body, Principal principal) {
        try {
            String currentPassword = body.get("currentPassword");
            String newPassword = body.get("newPassword");
            if (currentPassword == null || newPassword == null || newPassword.trim().isEmpty() || newPassword.length() < 6) {
                return ResponseEntity.badRequest().body(new ApiResponse("La nueva contraseña debe tener al menos 6 caracteres"));
            }
            userService.updatePassword(principal.getName(), currentPassword, newPassword);
            return ResponseEntity.ok(new ApiResponse("Contrasena actualizada"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage()));
        }
    }
}
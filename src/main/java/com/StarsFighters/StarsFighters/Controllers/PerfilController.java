package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Models.Dto.CreateUser;
import com.StarsFighters.StarsFighters.Models.Dto.LoginUser;
import com.StarsFighters.StarsFighters.Models.Dto.UserProfileDto;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Services.FriendshipService;
import com.StarsFighters.StarsFighters.Services.JwtService;
import com.StarsFighters.StarsFighters.Services.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class PerfilController {

    @Autowired
    JwtService jwtService;

    @Autowired
    UserService userService;

    @Autowired
    FriendshipService friendshipService;

    @Autowired
    SimpMessagingTemplate messagingTemplate;

    @GetMapping("/usuario")
    public Map<String, Object> user(@AuthenticationPrincipal OAuth2User principal) {
        return principal.getAttributes();
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody CreateUser user){
        try{
            userService.registUser(user);
            return ResponseEntity.ok("Usuario registrado");
        } catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginUser loginData) {
        try {
            User user = userService.loginUser(loginData);
            String token = jwtService.generateToken(user);
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "username", user.getUsername(),
                    "email", user.getEmail()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            Long userId = jwtService.extractId(token);
            UserProfileDto profile = userService.getUserProfileById(userId);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al cargar el perfil: " + e.getMessage());
        }
    }

    @PutMapping("/status")
    public ResponseEntity<?> updateStatusPreference(@RequestParam String pref, Principal principal) {
        try {
            String username = principal.getName();
            userService.updateStatusPreference(username, pref);

            String currentStatus = "OFFLINE";
            if ("ACTIVE".equals(pref)) {
                currentStatus = "ONLINE";
            } else if ("DND".equals(pref)) {
                currentStatus = "DND";
            } else if ("INVISIBLE".equals(pref)) {
                currentStatus = "OFFLINE";
            }

            Map<String, Object> presenceMsg = Map.of(
                    "type", "PRESENCE",
                    "username", username,
                    "status", currentStatus
            );

            friendshipService.getAcceptedFriends(username).forEach(friend -> {
                messagingTemplate.convertAndSendToUser(
                        friend.username(),
                        "/queue/notifications",
                        presenceMsg
                );
            });

            return ResponseEntity.ok("Estado actualizado");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al actualizar el estado");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("user_session", null);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        return ResponseEntity.ok("Sesión cerrada");
    }
}
package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Models.DAOs.CreateUser;
import com.StarsFighters.StarsFighters.Models.DAOs.LoginUser;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Services.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class PerfilController {

    @Autowired
    UserService userService;

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
    public ResponseEntity<?> login(@RequestBody LoginUser loginData, HttpServletResponse response){
        try{
            User user = userService.loginUser(loginData);

            Cookie cookie = new Cookie("user_session", user.getId().toString());
            cookie.setHttpOnly(true);
            cookie.setSecure(false);
            cookie.setPath("/");
            cookie.setMaxAge(7 * 24 * 60 * 60);

            response.addCookie(cookie);

            return ResponseEntity.ok(Map.of(
                    "username", user.getUsername(),
                    "email", user.getEmail()
            ));
        } catch (Exception e){
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> checkSession(@CookieValue(value = "user_session", required = false) String sessionCookie) {
        if (sessionCookie == null) {
            return ResponseEntity.status(401).body("No autenticado");
        }
        return ResponseEntity.ok("Sesión activa");
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
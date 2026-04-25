package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Models.DAOs.CreateUser;
import com.StarsFighters.StarsFighters.Services.UserService;
import org.apache.coyote.Response;
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
            return ResponseEntity.ok("Welcome" + user.username());
        } catch (Exception e){
            e.printStackTrace();
            throw new RuntimeException("Can not Register this user");
        }

    }
}
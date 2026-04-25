package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Models.DAOs.CreateUser;
import org.apache.coyote.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class PerfilController {

    @GetMapping("/usuario")
    public Map<String, Object> user(@AuthenticationPrincipal OAuth2User principal) {

        return principal.getAttributes();
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody CreateUser user){
        return ResponseEntity.ok("Falta completar ");
    }
}
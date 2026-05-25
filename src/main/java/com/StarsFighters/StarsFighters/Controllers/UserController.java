package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Repositories.UserRepo;
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

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam String query, Principal principal) {
        String currentUsername = principal.getName();
        List<User> users = userRepo.findByUsernameContainingIgnoreCase(query);

        List<Map<String, String>> results = users.stream()
                .filter(u -> !u.getUsername().equals(currentUsername))
                .limit(5)
                .map(u -> Map.of("username", u.getUsername(), "friendCode", u.getFriendCode()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }
}
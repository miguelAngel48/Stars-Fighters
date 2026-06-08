package com.StarsFighters.StarsFighters.Configuration;

import com.StarsFighters.StarsFighters.Services.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
public class JwtTokenValidator {

    @Autowired
    private JwtService jwtService;

    public Authentication getAuthentication(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        String jwt = authHeader.substring(7);

        try {
            String username = jwtService.extractUsername(jwt);

            if (username != null && jwtService.isTokenValid(jwt)) {
                return new UsernamePasswordAuthenticationToken(username, null, new ArrayList<>());
            }
        } catch (Exception e) {
            System.out.println("Error validando JWT: " + e.getMessage());
        }

        return null;
    }
}
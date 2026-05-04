package com.StarsFighters.StarsFighters.Configuration;

import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Services.JwtService; // Ajusta este import a tu paquete real
import com.StarsFighters.StarsFighters.Services.UserService; // Ajusta este import a tu paquete real

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserService userService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        // 1. Obtenemos el perfil del usuario que nos manda Google
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        // 2. Extraemos los datos clave que necesitamos (email y nombre)
        String email = oAuth2User.getAttribute("email");
        String nombre = oAuth2User.getAttribute("name");


        User user = userService.processOAuthPostLogin(email, nombre);


        String token = jwtService.generateToken(user);
        String frontendUrl = "http://localhost:5173/oauth2/redirect?token=" + token;

        response.sendRedirect(frontendUrl);
    }
}
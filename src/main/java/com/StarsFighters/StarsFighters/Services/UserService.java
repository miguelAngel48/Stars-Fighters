package com.StarsFighters.StarsFighters.Services;

import com.StarsFighters.StarsFighters.Models.DAOs.CreateUser;
import com.StarsFighters.StarsFighters.Models.DAOs.LoginUser;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Repositories.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    @Autowired
    UserRepo userRepo;

    @Autowired
    PasswordEncoder passwordEncoder;

    public void registUser(CreateUser newUser){
        if (userRepo.existsByEmail(newUser.email())) {
            throw new RuntimeException("El email ya está registrado");
        }
        User user = new User();
        user.setEmail(newUser.email());
        user.setUsername(newUser.username());
        user.setPassword(passwordEncoder.encode(newUser.password()));
        userRepo.save(user);
    }

    public User loginUser(LoginUser loginData) {
        User user = userRepo.findByEmail(loginData.email())
                .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));

        if (!passwordEncoder.matches(loginData.password(), user.getPassword())) {
            throw new RuntimeException("Credenciales inválidas");
        }

        return user;
    }

    public User processOAuthPostLogin(String email, String nombre) {
        User existUser = userRepo.findByEmail(email).orElse(null);

        if (existUser == null) {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(nombre.replace(" ", ""));
            return userRepo.save(newUser);
        }
        return existUser;
    }
}
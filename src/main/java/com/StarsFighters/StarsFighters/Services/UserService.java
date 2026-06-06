package com.StarsFighters.StarsFighters.Services;

import com.StarsFighters.StarsFighters.Models.Dto.CreateUser;
import com.StarsFighters.StarsFighters.Models.Dto.LoginUser;
import com.StarsFighters.StarsFighters.Models.Dto.UserProfileDto;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Repositories.UserRepo;
import com.StarsFighters.StarsFighters.Utils.FriendCodeGenerator;
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
        user.setFriendCode(FriendCodeGenerator.generateCode());
        user.setLevel(1);
        user.setRole("USER");
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
            newUser.setUsername(nombre);
            newUser.setLevel(1);
            newUser.setRole("USER");
            newUser.setFriendCode(FriendCodeGenerator.generateCode());
            return userRepo.save(newUser);
        } else if (existUser.getFriendCode() == null || existUser.getFriendCode().trim().isEmpty()) {
            existUser.setFriendCode(FriendCodeGenerator.generateCode());
            return userRepo.save(existUser);
        }

        return existUser;
    }

    public void updateStatusPreference(String username, String statusPreference) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        user.setStatusPreference(statusPreference);
        userRepo.save(user);
    }

    public UserProfileDto getUserProfileById(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("This user does not exist"));

        return new UserProfileDto(
                user.getUsername(),
                user.getEmail(),
                user.getFriendCode(),
                user.getLevel(),
                user.getCoins(),
                user.getSinceCreated(),
                user.getStatusPreference(),
                user.getEquippedAvatarUrl(),
                user.getRole()
        );
    }

    public void recordMatchResult(String username, boolean isWinner) {

        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado en la base de datos"));
        if (isWinner) {
            user.setWins(user.getWins() + 1);
            user.setCoins(user.getCoins() + 10);
        } else {
            user.setLosses(user.getLosses() + 1);
            user.setCoins(user.getCoins() + 5);
        }
        userRepo.save(user);
    }



}
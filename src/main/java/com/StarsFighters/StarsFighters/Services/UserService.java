package com.StarsFighters.StarsFighters.Services;

import com.StarsFighters.StarsFighters.Models.Dto.CreateUser;
import com.StarsFighters.StarsFighters.Models.Dto.LoginUser;
import com.StarsFighters.StarsFighters.Models.Dto.UserProfileDto;
import com.StarsFighters.StarsFighters.Models.Entities.Cosmetic;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Repositories.CosmeticRepo;
import com.StarsFighters.StarsFighters.Repositories.UserRepo;
import com.StarsFighters.StarsFighters.Utils.FriendCodeGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    UserRepo userRepo;

    @Autowired
    CosmeticRepo cosmeticRepo;

    @Autowired
    PasswordEncoder passwordEncoder;

    public static class ActiveMatch {
        public String player1;
        public String player2;
        public long startTime;
        public boolean p1Processed = false;
        public boolean p2Processed = false;

        public ActiveMatch(String p1, String p2) {
            this.player1 = p1;
            this.player2 = p2;
            this.startTime = System.currentTimeMillis();
        }
    }

    private final Map<String, ActiveMatch> activeMatches = new java.util.concurrent.ConcurrentHashMap<>();

    public record LeaderboardDto(String username, int level, int wins, String avatarUrl) {}

    private Cosmetic getOrCreateDefaultAvatar() {
        String defaultUrl = "/uploads/cosmetics/avatar.png";
        return cosmeticRepo.findAll().stream()
                .filter(c -> defaultUrl.equals(c.getImageUrl()))
                .findFirst()
                .orElseGet(() -> {
                    Cosmetic defaultAvatar = new Cosmetic("Avatar por Defecto", 0, defaultUrl, "AVATAR");
                    return cosmeticRepo.save(defaultAvatar);
                });
    }

    @Transactional
    public void registUser(CreateUser newUser){
        if (userRepo.existsByEmail(newUser.email())) {
            throw new RuntimeException("El email ya esta registrado");
        }
        User user = new User();
        user.setEmail(newUser.email());
        user.setUsername(newUser.username());
        user.setPassword(passwordEncoder.encode(newUser.password()));
        user.setFriendCode(FriendCodeGenerator.generateCode());
        user.setLevel(1);
        user.setRole("USER");

        Cosmetic defaultAvatar = getOrCreateDefaultAvatar();
        user.getOwnedCosmetics().add(defaultAvatar);
        user.setEquippedAvatarUrl(defaultAvatar.getImageUrl());

        userRepo.save(user);
    }

    public User loginUser(LoginUser loginData) {
        User user = userRepo.findByEmail(loginData.email())
                .orElseThrow(() -> new RuntimeException("Credenciales invalidas"));

        if (!passwordEncoder.matches(loginData.password(), user.getPassword())) {
            throw new RuntimeException("Credenciales invalidas");
        }

        return user;
    }

    @Transactional
    public User processOAuthPostLogin(String email, String nombre) {
        User existUser = userRepo.findByEmail(email).orElse(null);

        if (existUser == null) {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(nombre);
            newUser.setLevel(1);
            newUser.setRole("USER");
            newUser.setFriendCode(FriendCodeGenerator.generateCode());

            Cosmetic defaultAvatar = getOrCreateDefaultAvatar();
            newUser.getOwnedCosmetics().add(defaultAvatar);
            newUser.setEquippedAvatarUrl(defaultAvatar.getImageUrl());

            return userRepo.save(newUser);
        } else if (existUser.getFriendCode() == null || existUser.getFriendCode().trim().isEmpty()) {
            existUser.setFriendCode(FriendCodeGenerator.generateCode());
            return userRepo.save(existUser);
        }

        return existUser;
    }

    private User findUserByPrincipal(String identifier) {
        return userRepo.findByEmail(identifier)
                .or(() -> userRepo.findByUsername(identifier))
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    @Transactional
    public void updateStatusPreference(String identifier, String statusPreference) {
        User user = findUserByPrincipal(identifier);
        user.setStatusPreference(statusPreference);
        userRepo.save(user);
    }

    public UserProfileDto getUserProfileById(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("This user does not exist"));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isOwner = false;
        if (auth != null && auth.isAuthenticated()) {
            String currentPrincipal = auth.getName();
            isOwner = currentPrincipal.equals(user.getEmail()) || currentPrincipal.equals(user.getUsername());
        }

        return new UserProfileDto(
                user.getUsername(),
                isOwner ? user.getEmail() : null,
                user.getFriendCode(),
                user.getLevel(),
                isOwner ? user.getCoins() : 0,
                user.getSinceCreated(),
                user.getStatusPreference(),
                user.getEquippedAvatarUrl(),
                isOwner ? user.getRole() : null,
                user.getWins(),
                user.getLosses(),
                user.getXp(),
                isOwner && user.getPassword() != null
        );
    }

    public void registerNormalMatch(String lobbyId, String player1, String player2) {
        long now = System.currentTimeMillis();
        activeMatches.entrySet().removeIf(entry -> now - entry.getValue().startTime > 3600000);
        activeMatches.put(lobbyId, new ActiveMatch(player1, player2));
    }

    public Map<String, Object> recordMatchResult(String username, boolean isWinner, String lobbyId) {
        ActiveMatch match = activeMatches.get(lobbyId);

        if (match == null) {
            throw new RuntimeException("Partida no valida, expirada o no es modo normal");
        }

        boolean isP1 = username.equals(match.player1);
        boolean isP2 = username.equals(match.player2);

        if (!isP1 && !isP2) {
            throw new RuntimeException("El usuario no pertenece a esta partida");
        }

        if ((isP1 && match.p1Processed) || (isP2 && match.p2Processed)) {
            throw new RuntimeException("El resultado de esta partida ya ha sido procesado");
        }

        if (System.currentTimeMillis() - match.startTime < 10000) {
            throw new RuntimeException("La partida termino demasiado rapido");
        }

        if (isP1) match.p1Processed = true;
        if (isP2) match.p2Processed = true;

        if (match.p1Processed && match.p2Processed) {
            activeMatches.remove(lobbyId);
        }

        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado en la base de datos"));

        int oldLevel = user.getLevel();

        if (isWinner) {
            user.setWins(user.getWins() + 1);
            user.setCoins(user.getCoins() + 10);
        } else {
            user.setLosses(user.getLosses() + 1);
            user.setCoins(user.getCoins() + 5);
        }

        if (user.getLevel() < 20) {
            int baseXp = 100 + (10 * user.getLevel());
            int xpGained = isWinner ? baseXp : (baseXp / 2);
            user.setXp(user.getXp() + xpGained);

            int xpRequiredForNextLevel = user.getLevel() * 100;

            while (user.getLevel() < 20 && user.getXp() >= xpRequiredForNextLevel) {
                user.setXp(user.getXp() - xpRequiredForNextLevel);
                user.setLevel(user.getLevel() + 1);
                xpRequiredForNextLevel = user.getLevel() * 100;
            }

            if (user.getLevel() >= 20) {
                user.setLevel(20);
                user.setXp(0);
            }
        }

        userRepo.save(user);

        boolean leveledUp = user.getLevel() > oldLevel;
        Map<String, Object> result = new HashMap<>();
        result.put("leveledUp", leveledUp);
        result.put("newLevel", user.getLevel());

        return result;
    }

    @Transactional
    public List<String> getOwnedAvatars(String identifier) {
        User user = findUserByPrincipal(identifier);

        return user.getOwnedCosmetics().stream()
                .filter(c -> c.getType() != null && "AVATAR".equalsIgnoreCase(c.getType()))
                .map(Cosmetic::getImageUrl)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateAvatar(String identifier, String avatarUrl) {
        User user = findUserByPrincipal(identifier);
        user.setEquippedAvatarUrl(avatarUrl);
        userRepo.save(user);
    }

    @Transactional
    public void updateUsername(String identifier, String newUsername) {
        if (userRepo.findByUsername(newUsername).isPresent()) {
            throw new RuntimeException("El nombre de usuario ya esta en uso");
        }
        User user = findUserByPrincipal(identifier);
        user.setUsername(newUsername);
        userRepo.save(user);
    }

    @Transactional
    public void updatePassword(String identifier, String currentPassword, String newPassword) {
        User user = findUserByPrincipal(identifier);

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("La contraseña actual es incorrecta");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);
    }

    public List<LeaderboardDto> getGlobalLeaderboard() {
        return userRepo.findTop10ByOrderByWinsDesc().stream()
                .map(u -> new LeaderboardDto(u.getUsername(), u.getLevel(), u.getWins(), u.getEquippedAvatarUrl()))
                .collect(Collectors.toList());
    }
}
package com.StarsFighters.StarsFighters.Models.Entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    private String username;
    private String password;
    private LocalDateTime sinceCreated;
    @Column(name = "level", columnDefinition = "integer default 1")
    private int Level;



    @Column(name = "xp", columnDefinition = "integer default 0")
    private int xp = 0;

    @Column(name = "wins", columnDefinition = "integer default 0")
    private int wins = 0;

    @Column(name = "losses", columnDefinition = "integer default 0")
    private int losses = 0;

    @Column(name = "coins", columnDefinition = "integer default 0")
    private int coins = 0;

    @Column(unique = true, length = 10)
    private String friendCode;

    private String statusPreference = "ACTIVE";
    private boolean isOnline = false;

    private String role = "USER";

    private String equippedAvatarUrl = "http://localhost:8080/uploads/cosmetics/default-avatar.png";

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Friendship> friendships = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "user_cosmetics",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "cosmetic_id")
    )
    private List<Cosmetic> ownedCosmetics = new ArrayList<>();

    public User() {
        this.sinceCreated = LocalDateTime.now();
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getStatusPreference() {
        return statusPreference;
    }

    public void setStatusPreference(String statusPreference) {
        this.statusPreference = statusPreference;
    }

    public boolean isOnline() {
        return isOnline;
    }

    public void setOnline(boolean online) {
        this.isOnline = online;
    }

    public int getLevel() {
        return Level;
    }

    public void setLevel(int level) {
        Level = level;
    }

    public String getFriendCode() {
        return friendCode;
    }

    public void setFriendCode(String friendCode) {
        this.friendCode = friendCode;
    }

    public LocalDateTime getSinceCreated() {
        return sinceCreated;
    }

    public void setSinceCreated(LocalDateTime sinceCreated) {
        this.sinceCreated = sinceCreated;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public List<Friendship> getFriendships() {
        return friendships;
    }

    public void setFriendships(List<Friendship> friendships) {
        this.friendships = friendships;
    }

    public String getEquippedAvatarUrl() {
        return equippedAvatarUrl;
    }

    public void setEquippedAvatarUrl(String equippedAvatarUrl) {
        this.equippedAvatarUrl = equippedAvatarUrl;
    }

    public List<Cosmetic> getOwnedCosmetics() {
        return ownedCosmetics;
    }

    public void setOwnedCosmetics(List<Cosmetic> ownedCosmetics) {
        this.ownedCosmetics = ownedCosmetics;
    }

    public int getWins() { return wins; }

    public void setWins(int wins) { this.wins = wins; }

    public int getLosses() { return losses; }

    public void setLosses(int losses) { this.losses = losses; }

    public int getCoins() { return coins; }

    public void setCoins(int coins) { this.coins = coins; }

    public int getXp() {return xp;  }

    public void setXp(int xp) {  this.xp = xp;  }


}
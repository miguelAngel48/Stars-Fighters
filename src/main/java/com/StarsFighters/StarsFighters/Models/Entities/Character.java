package com.StarsFighters.StarsFighters.Models.Entities;

import jakarta.persistence.*;

@Entity
@Table(name = "game_characters")
public class Character {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    private double speed;
    private double jumpForce;
    private int maxHp;
    private int baseDamage;

    @Column(length = 1000)
    private String description;

    private String spriteProfileUrl;
    private String spriteMovesUrl;

    public Character() {}

    public Character(String name, double speed, double jumpForce, int maxHp, int baseDamage, String description,
                     String spriteProfileUrl, String spriteMovesUrl) {
        this.name = name;
        this.speed = speed;
        this.jumpForce = jumpForce;
        this.maxHp = maxHp;
        this.baseDamage = baseDamage;
        this.description = description;
        this.spriteProfileUrl = spriteProfileUrl;
        this.spriteMovesUrl = spriteMovesUrl;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public double getSpeed() { return speed; }
    public void setSpeed(double speed) { this.speed = speed; }
    public double getJumpForce() { return jumpForce; }
    public void setJumpForce(double jumpForce) { this.jumpForce = jumpForce; }
    public int getMaxHp() { return maxHp; }
    public void setMaxHp(int maxHp) { this.maxHp = maxHp; }
    public int getBaseDamage() { return baseDamage; }
    public void setBaseDamage(int baseDamage) { this.baseDamage = baseDamage; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSpriteProfileUrl() { return spriteProfileUrl; }
    public void setSpriteProfileUrl(String spriteProfileUrl) { this.spriteProfileUrl = spriteProfileUrl; }
    public String getSpriteMovesUrl() { return spriteMovesUrl; }
    public void setSpriteMovesUrl(String spriteMovesUrl) { this.spriteMovesUrl = spriteMovesUrl; }
}
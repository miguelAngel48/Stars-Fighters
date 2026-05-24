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


    private String spriteIdleUrl;
    private String spriteRunUrl;
    private String spriteAttackUrl;


    public Character() {}


    public Character(String name, double speed, double jumpForce, int maxHp, int baseDamage,
                     String spriteIdleUrl, String spriteRunUrl, String spriteAttackUrl) {
        this.name = name;
        this.speed = speed;
        this.jumpForce = jumpForce;
        this.maxHp = maxHp;
        this.baseDamage = baseDamage;
        this.spriteIdleUrl = spriteIdleUrl;
        this.spriteRunUrl = spriteRunUrl;
        this.spriteAttackUrl = spriteAttackUrl;
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
    public String getSpriteIdleUrl() { return spriteIdleUrl; }
    public void setSpriteIdleUrl(String spriteIdleUrl) { this.spriteIdleUrl = spriteIdleUrl; }
    public String getSpriteRunUrl() { return spriteRunUrl; }
    public void setSpriteRunUrl(String spriteRunUrl) { this.spriteRunUrl = spriteRunUrl; }
    public String getSpriteAttackUrl() { return spriteAttackUrl; }
    public void setSpriteAttackUrl(String spriteAttackUrl) { this.spriteAttackUrl = spriteAttackUrl; }
}
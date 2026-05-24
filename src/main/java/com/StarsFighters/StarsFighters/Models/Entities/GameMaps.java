package com.StarsFighters.StarsFighters.Models.Entities;

import jakarta.persistence.*;

@Entity
@Table(name = "game_maps")
public class GameMaps {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private String backgroundUrl;
    private double gravity;


    public GameMaps() {}

    public GameMaps(String name, String description, String backgroundUrl, double gravity) {
        this.name = name;
        this.description = description;
        this.backgroundUrl = backgroundUrl;
        this.gravity = gravity;

    }


    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getBackgroundUrl() { return backgroundUrl; }
    public double getGravity() { return gravity; }

}
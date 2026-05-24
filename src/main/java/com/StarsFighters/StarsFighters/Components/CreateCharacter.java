package com.StarsFighters.StarsFighters.Components;

import com.StarsFighters.StarsFighters.Models.Entities.Character;
import com.StarsFighters.StarsFighters.Models.Entities.GameMaps;
import com.StarsFighters.StarsFighters.Repositories.CharacteRepo;
import com.StarsFighters.StarsFighters.Repositories.GameMapsRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class CreateCharacter implements CommandLineRunner {
@Autowired
    private GameMapsRepo mapRepo;
    @Autowired
    private CharacteRepo characterRepo;

    @Override
    public void run(String... args) throws Exception {
        if (characterRepo.count() == 0) {
            characterRepo.save(new Character(
                    "Samurai",
                    5.0,
                    12.0,
                    100,
                    15,
                    "/assets/sprites/samurai.png",
                    "/assets/sprites/knight_run.png",
                    "/assets/sprites/knight_attack.png"
            ));

            characterRepo.save(new Character(
                    "Shinobi",
                    7.5,
                    10.0,
                    100,
                    10,
                    "/assets/sprites/ninja_idle.png",
                    "/assets/sprites/ninja_run.png",
                    "/assets/sprites/ninja_attack.png"
            ));
        }
        if (mapRepo.count() == 0) {
            mapRepo.save(new GameMaps(
                    "Estación Espacial Alfa",
                    "Un mapa en el espacio con una plataforma central",
                    "/assets/maps/space_station.png",
                    0.6

            ));

        }
    }
}
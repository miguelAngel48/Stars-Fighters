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
                    "Un guerrero implacable que sigue el código del Bushido. Sus ataques con espada son precisos, rápidos y devastadores en el combate cuerpo a cuerpo.",
                    "/sprites/samurai_profile.png",
                    "/sprites/samurai.png"
            ));

            characterRepo.save(new Character(
                    "Shinobi",
                    7.5,
                    10.0,
                    100,
                    10,
                    "Maestro de las sombras y el sigilo. Su increíble velocidad y movilidad le permiten esquivar ataques y golpear cuando el enemigo menos lo espera.",
                    "/sprites/shinobi_profile.png",
                    "/sprites/shinobi.png"
            ));
        }

        if (mapRepo.count() == 0) {
            mapRepo.save(new GameMaps(
                    "Bosque Olvido",
                    "Un bosque tranquilo",
                    "/maps/background_field.png",
                    0.8
            ));
        }
    }
}
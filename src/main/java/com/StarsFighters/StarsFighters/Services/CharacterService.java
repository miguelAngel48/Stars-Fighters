package com.StarsFighters.StarsFighters.Services;

import com.StarsFighters.StarsFighters.Models.Dto.CharacterDto;
import com.StarsFighters.StarsFighters.Repositories.CharacteRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CharacterService {

    @Autowired
    private CharacteRepo characterRepo;

    public List<CharacterDto> getAllCharacters() {
        return characterRepo.findAll().stream()
                .map(c -> new CharacterDto(
                        c.getId(),
                        c.getName(),
                        c.getSpeed(),
                        c.getJumpForce(),
                        c.getMaxHp(),
                        c.getBaseDamage(),
                        c.getSpriteIdleUrl(),
                        c.getSpriteRunUrl(),
                        c.getSpriteAttackUrl()
                ))
                .collect(Collectors.toList());
    }
}
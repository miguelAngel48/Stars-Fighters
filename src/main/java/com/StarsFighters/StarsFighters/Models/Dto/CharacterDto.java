package com.StarsFighters.StarsFighters.Models.Dto;

public record CharacterDto(
        Long id,
        String name,
        double speed,
        double jumpForce,
        int maxHp,
        int baseDamage,
        String spriteProfileUrl,
        String spriteMovesUrl

) {}
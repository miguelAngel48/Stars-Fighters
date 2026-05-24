package com.StarsFighters.StarsFighters.Models.Dto;

public record GameMapsDto(
        Long id,
        String name,
        String description,
        String backgroundUrl,
        double gravity
) {}
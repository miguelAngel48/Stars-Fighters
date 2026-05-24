package com.StarsFighters.StarsFighters.Models.Dto;

public record SelectionDto(
        String type,
        String role,
        Long characterId,
        String characterName,
        Long mapId,
        String lobbyId
) {}
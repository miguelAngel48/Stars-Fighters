package com.StarsFighters.StarsFighters.Models.Dto;

public record GameStartDto(
        String type,
        Long mapId,
        Long leaderCharId,
        Long guestCharId,
        String lobbyId
) {}
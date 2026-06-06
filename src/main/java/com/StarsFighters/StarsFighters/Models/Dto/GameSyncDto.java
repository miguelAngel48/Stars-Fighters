package com.StarsFighters.StarsFighters.Models.Dto;

public record GameSyncDto(
        String lobbyId,
        String targetUsername,
        double x,
        double y,
        String action,
        int direction
) {}
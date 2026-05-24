package com.StarsFighters.StarsFighters.Models.Dto;

public record FriendDto(
        Long id,
        String username,
        String friendCode,
        Long friendshipId,
        String currentStatus
) {}
package com.StarsFighters.StarsFighters.Models.Dto;

public record GameInviteDto(
        String type,
        Long senderId,
        String senderName,
        String lobbyId
) {}
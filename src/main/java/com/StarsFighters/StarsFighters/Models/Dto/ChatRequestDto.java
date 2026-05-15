package com.StarsFighters.StarsFighters.Models.Dto;

public record ChatRequestDto(
        Long friendshipId,
        String receiverUsername,
        String content
) {}
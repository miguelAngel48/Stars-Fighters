package com.StarsFighters.StarsFighters.Models.Dto;

import java.time.LocalDateTime;

public record ChatMessageDto(
        Long id,
        Long senderId,
        String senderUsername,
        Long friendshipId,
        String content,
        LocalDateTime createdAt
) {}
package com.StarsFighters.StarsFighters.Models.Dto;

import java.time.LocalDateTime;

public record UserProfileDto(
        String username,
        String email,
        String friendCode,
        int level,
        int coins,
        LocalDateTime sinceCreated,
        String statusPreference,
        String avatarUrl,
        String role,
        int wins,
        int losses
) {}
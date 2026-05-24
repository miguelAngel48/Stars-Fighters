package com.StarsFighters.StarsFighters.Models.Dto;

import java.time.LocalDateTime;

public record UserProfileDto(
        String username,
        String email,
        String friendCode,
        int level,
        LocalDateTime sinceCreated,
        String statusPreference
) {}
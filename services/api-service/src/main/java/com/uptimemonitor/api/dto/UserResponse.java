package com.uptimemonitor.api.dto;

import com.uptimemonitor.common.entity.User;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String name,
        String pictureUrl,
        String status,
        Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getPictureUrl(),
                user.getStatus().name(),
                user.getCreatedAt()
        );
    }
}

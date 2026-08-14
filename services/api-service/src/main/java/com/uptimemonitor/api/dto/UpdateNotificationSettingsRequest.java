package com.uptimemonitor.api.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateNotificationSettingsRequest(
        @NotNull(message = "emailEnabled is required")
        Boolean emailEnabled,

        @NotNull(message = "notifyOnDown is required")
        Boolean notifyOnDown,

        @NotNull(message = "notifyOnRecovery is required")
        Boolean notifyOnRecovery
) {
}

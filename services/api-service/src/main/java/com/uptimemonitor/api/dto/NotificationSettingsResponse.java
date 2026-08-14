package com.uptimemonitor.api.dto;

import com.uptimemonitor.common.entity.MonitorNotificationSettings;

import java.util.UUID;

public record NotificationSettingsResponse(
        UUID id,
        UUID monitorId,
        boolean emailEnabled,
        boolean notifyOnDown,
        boolean notifyOnRecovery
) {
    public static NotificationSettingsResponse from(MonitorNotificationSettings settings) {
        return new NotificationSettingsResponse(
                settings.getId(),
                settings.getMonitorId(),
                settings.getEmailEnabled(),
                settings.getNotifyOnDown(),
                settings.getNotifyOnRecovery()
        );
    }
}

package com.uptimemonitor.api.service;

import com.uptimemonitor.api.dto.UpdateNotificationSettingsRequest;
import com.uptimemonitor.api.exception.ResourceNotFoundException;
import com.uptimemonitor.common.entity.MonitorNotificationSettings;
import com.uptimemonitor.common.repository.MonitorNotificationSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class NotificationSettingsService {

    private final MonitorNotificationSettingsRepository repository;

    public NotificationSettingsService(MonitorNotificationSettingsRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public MonitorNotificationSettings getSettings(UUID monitorId) {
        return repository.findByMonitorId(monitorId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification settings for monitor " + monitorId));
    }

    @Transactional
    public MonitorNotificationSettings updateSettings(UUID monitorId, UpdateNotificationSettingsRequest request) {
        MonitorNotificationSettings settings = getSettings(monitorId);
        settings.setEmailEnabled(request.emailEnabled());
        settings.setNotifyOnDown(request.notifyOnDown());
        settings.setNotifyOnRecovery(request.notifyOnRecovery());
        return repository.save(settings);
    }
}

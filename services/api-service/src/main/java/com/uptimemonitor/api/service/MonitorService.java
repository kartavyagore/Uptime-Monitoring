package com.uptimemonitor.api.service;

import com.uptimemonitor.api.dto.CreateMonitorRequest;
import com.uptimemonitor.api.dto.UpdateMonitorRequest;
import com.uptimemonitor.api.exception.MonitorLimitExceededException;
import com.uptimemonitor.api.exception.ResourceNotFoundException;
import com.uptimemonitor.api.policy.MonitorLimitPolicy;
import com.uptimemonitor.common.entity.Monitor;
import com.uptimemonitor.common.entity.MonitorNotificationSettings;
import com.uptimemonitor.common.enums.MonitorStatus;
import com.uptimemonitor.common.repository.MonitorNotificationSettingsRepository;
import com.uptimemonitor.common.repository.MonitorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class MonitorService {

    private static final Logger log = LoggerFactory.getLogger(MonitorService.class);

    private final MonitorRepository monitorRepository;
    private final MonitorNotificationSettingsRepository notificationSettingsRepository;
    private final MonitorLimitPolicy limitPolicy;

    public MonitorService(MonitorRepository monitorRepository,
                          MonitorNotificationSettingsRepository notificationSettingsRepository,
                          MonitorLimitPolicy limitPolicy) {
        this.monitorRepository = monitorRepository;
        this.notificationSettingsRepository = notificationSettingsRepository;
        this.limitPolicy = limitPolicy;
    }

    /**
     * Create a new monitor. Enforces the 3-monitor limit on the backend.
     * Also creates default notification settings for the new monitor.
     */
    @Transactional
    public Monitor createMonitor(UUID userId, CreateMonitorRequest request) {
        // Enforce monitor limit — checked inside a transaction to prevent race conditions
        long currentCount = monitorRepository.countActiveMonitorsByUserId(userId);
        if (!limitPolicy.isWithinLimit(currentCount)) {
            throw new MonitorLimitExceededException((int) currentCount, limitPolicy.getMaxMonitorsPerUser());
        }

        Monitor monitor = Monitor.builder()
                .userId(userId)
                .name(request.name())
                .url(request.url())
                .httpMethod(request.httpMethod())
                .expectedStatusCode(request.expectedStatusCode())
                .intervalSeconds(request.intervalSeconds())
                .timeoutMs(request.timeoutMs())
                .enabled(true)
                .currentStatus(MonitorStatus.UNKNOWN)
                .build();

        Monitor saved = monitorRepository.save(monitor);

        // Create default notification settings (email enabled, notify on down + recovery)
        MonitorNotificationSettings notifSettings = MonitorNotificationSettings.builder()
                .monitorId(saved.getId())
                .emailEnabled(true)
                .notifyOnDown(true)
                .notifyOnRecovery(true)
                .build();
        notificationSettingsRepository.save(notifSettings);

        log.info("Created monitor: id={}, name={}, url={}, userId={}", saved.getId(), saved.getName(), saved.getUrl(), userId);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Monitor> getMonitorsByUser(UUID userId) {
        return monitorRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public Monitor getMonitorByIdAndUser(UUID monitorId, UUID userId) {
        return monitorRepository.findByIdAndUserId(monitorId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Monitor", monitorId));
    }

    @Transactional
    public Monitor updateMonitor(UUID monitorId, UUID userId, UpdateMonitorRequest request) {
        Monitor monitor = getMonitorByIdAndUser(monitorId, userId);

        if (request.name() != null) monitor.setName(request.name());
        if (request.url() != null) monitor.setUrl(request.url());
        if (request.httpMethod() != null) monitor.setHttpMethod(request.httpMethod());
        if (request.expectedStatusCode() != null) monitor.setExpectedStatusCode(request.expectedStatusCode());
        if (request.intervalSeconds() != null) monitor.setIntervalSeconds(request.intervalSeconds());
        if (request.timeoutMs() != null) monitor.setTimeoutMs(request.timeoutMs());

        log.info("Updated monitor: id={}", monitorId);
        return monitorRepository.save(monitor);
    }

    @Transactional
    public void deleteMonitor(UUID monitorId, UUID userId) {
        Monitor monitor = getMonitorByIdAndUser(monitorId, userId);
        monitorRepository.delete(monitor);
        log.info("Deleted monitor: id={}", monitorId);
    }

    @Transactional
    public Monitor pauseMonitor(UUID monitorId, UUID userId) {
        Monitor monitor = getMonitorByIdAndUser(monitorId, userId);
        monitor.setEnabled(false);
        monitor.setCurrentStatus(MonitorStatus.PAUSED);
        log.info("Paused monitor: id={}", monitorId);
        return monitorRepository.save(monitor);
    }

    @Transactional
    public Monitor resumeMonitor(UUID monitorId, UUID userId) {
        Monitor monitor = getMonitorByIdAndUser(monitorId, userId);
        monitor.setEnabled(true);
        monitor.setCurrentStatus(MonitorStatus.UNKNOWN);
        log.info("Resumed monitor: id={}", monitorId);
        return monitorRepository.save(monitor);
    }

    @Transactional(readOnly = true)
    public int getMonitorCount(UUID userId) {
        return monitorRepository.countByUserId(userId);
    }

    public int getMaxMonitorsPerUser() {
        return limitPolicy.getMaxMonitorsPerUser();
    }
}

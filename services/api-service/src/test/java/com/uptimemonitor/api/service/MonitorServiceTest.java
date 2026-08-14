package com.uptimemonitor.api.service;

import com.uptimemonitor.api.dto.CreateMonitorRequest;
import com.uptimemonitor.api.exception.MonitorLimitExceededException;
import com.uptimemonitor.api.policy.MonitorLimitPolicy;
import com.uptimemonitor.common.entity.Monitor;
import com.uptimemonitor.common.enums.HttpMethodType;
import com.uptimemonitor.common.enums.MonitorStatus;
import com.uptimemonitor.common.repository.MonitorNotificationSettingsRepository;
import com.uptimemonitor.common.repository.MonitorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MonitorServiceTest {

    @Mock private MonitorRepository monitorRepository;
    @Mock private MonitorNotificationSettingsRepository notificationSettingsRepository;
    @Mock private MonitorLimitPolicy limitPolicy;

    @InjectMocks private MonitorService monitorService;

    private static final UUID USER_ID = UUID.randomUUID();

    @Test
    void shouldCreateMonitorWhenBelowLimit() {
        when(monitorRepository.countActiveMonitorsByUserId(USER_ID)).thenReturn(1L);
        when(limitPolicy.isWithinLimit(1L)).thenReturn(true);
        when(monitorRepository.save(any(Monitor.class))).thenAnswer(inv -> {
            Monitor m = inv.getArgument(0);
            m.setId(UUID.randomUUID());
            return m;
        });
        when(notificationSettingsRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CreateMonitorRequest request = new CreateMonitorRequest(
                "Test Monitor", "https://example.com", HttpMethodType.GET, 200, 60, 10000);

        Monitor created = monitorService.createMonitor(USER_ID, request);

        assertNotNull(created);
        assertEquals("Test Monitor", created.getName());
        assertEquals("https://example.com", created.getUrl());
        assertEquals(MonitorStatus.UNKNOWN, created.getCurrentStatus());
        verify(notificationSettingsRepository).save(any()); // Default notifications created
    }

    @Test
    void shouldRejectCreationWhenAtLimit() {
        when(monitorRepository.countActiveMonitorsByUserId(USER_ID)).thenReturn(3L);
        when(limitPolicy.isWithinLimit(3L)).thenReturn(false);
        when(limitPolicy.getMaxMonitorsPerUser()).thenReturn(3);

        CreateMonitorRequest request = new CreateMonitorRequest(
                "Monitor 4", "https://example.com", null, null, null, null);

        assertThrows(MonitorLimitExceededException.class,
                () -> monitorService.createMonitor(USER_ID, request));
    }

    @Test
    void shouldPauseMonitor() {
        Monitor monitor = Monitor.builder()
                .id(UUID.randomUUID()).userId(USER_ID).enabled(true)
                .currentStatus(MonitorStatus.UP).build();
        when(monitorRepository.findByIdAndUserId(monitor.getId(), USER_ID)).thenReturn(Optional.of(monitor));
        when(monitorRepository.save(any(Monitor.class))).thenAnswer(inv -> inv.getArgument(0));

        Monitor paused = monitorService.pauseMonitor(monitor.getId(), USER_ID);

        assertFalse(paused.getEnabled());
        assertEquals(MonitorStatus.PAUSED, paused.getCurrentStatus());
    }

    @Test
    void shouldResumeMonitor() {
        Monitor monitor = Monitor.builder()
                .id(UUID.randomUUID()).userId(USER_ID).enabled(false)
                .currentStatus(MonitorStatus.PAUSED).build();
        when(monitorRepository.findByIdAndUserId(monitor.getId(), USER_ID)).thenReturn(Optional.of(monitor));
        when(monitorRepository.save(any(Monitor.class))).thenAnswer(inv -> inv.getArgument(0));

        Monitor resumed = monitorService.resumeMonitor(monitor.getId(), USER_ID);

        assertTrue(resumed.getEnabled());
        assertEquals(MonitorStatus.UNKNOWN, resumed.getCurrentStatus());
    }
}

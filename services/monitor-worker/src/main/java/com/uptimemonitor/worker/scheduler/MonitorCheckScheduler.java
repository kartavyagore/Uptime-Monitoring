package com.uptimemonitor.worker.scheduler;

import com.uptimemonitor.common.entity.Monitor;
import com.uptimemonitor.common.entity.MonitorCheckResult;
import com.uptimemonitor.common.enums.CheckStatus;
import com.uptimemonitor.common.enums.MonitorStatus;
import com.uptimemonitor.common.repository.MonitorCheckResultRepository;
import com.uptimemonitor.common.repository.MonitorRepository;
import com.uptimemonitor.worker.checker.HealthCheckExecutor;
import com.uptimemonitor.worker.checker.HealthCheckResult;
import com.uptimemonitor.worker.notification.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Scheduler that periodically scans for monitors due for checking.
 *
 * Design decisions:
 * - Uses Spring @Scheduled with a configurable fixed rate
 * - Finds monitors due based on their interval_seconds and last_checked_at
 * - Processing is sequential for MVP (horizontally scalable via multiple workers later)
 * - The scheduling mechanism can be replaced with EventBridge/SQS without changing check logic
 */
@Component
public class MonitorCheckScheduler {

    private static final Logger log = LoggerFactory.getLogger(MonitorCheckScheduler.class);

    private final MonitorRepository monitorRepository;
    private final MonitorCheckResultRepository checkResultRepository;
    private final HealthCheckExecutor healthCheckExecutor;
    private final NotificationService notificationService;

    public MonitorCheckScheduler(MonitorRepository monitorRepository,
                                  MonitorCheckResultRepository checkResultRepository,
                                  HealthCheckExecutor healthCheckExecutor,
                                  NotificationService notificationService) {
        this.monitorRepository = monitorRepository;
        this.checkResultRepository = checkResultRepository;
        this.healthCheckExecutor = healthCheckExecutor;
        this.notificationService = notificationService;
    }

    /**
     * Main scheduling loop — runs at a fixed rate.
     * Identifies monitors that are due and processes each one.
     */
    @Scheduled(
            fixedRateString = "${app.scheduler.fixed-rate-ms:15000}",
            initialDelayString = "${app.scheduler.initial-delay-ms:10000}")
    public void checkDueMonitors() {
        // Find monitors that haven't been checked recently enough
        Instant cutoff = Instant.now().minusSeconds(5); // Small buffer to avoid immediate re-checks
        List<Monitor> dueMonitors = monitorRepository.findMonitorsDueForCheck(MonitorStatus.PAUSED, cutoff);

        if (dueMonitors.isEmpty()) {
            log.debug("No monitors due for checking");
            return;
        }

        log.info("Found {} monitors due for checking", dueMonitors.size());

        for (Monitor monitor : dueMonitors) {
            try {
                // Only process if actually due based on interval
                if (monitor.getLastCheckedAt() != null) {
                    Instant nextDue = monitor.getLastCheckedAt().plusSeconds(monitor.getIntervalSeconds());
                    if (nextDue.isAfter(Instant.now())) {
                        continue; // Not yet due
                    }
                }
                processMonitor(monitor);
            } catch (Exception e) {
                // One failed monitor must not stop the rest
                log.error("Error processing monitor {}: {}", monitor.getId(), e.getMessage(), e);
            }
        }
    }

    /**
     * Process a single monitor: execute health check, persist result,
     * detect state transition, trigger notifications.
     */
    @Transactional
    public void processMonitor(Monitor monitor) {
        log.debug("Checking monitor: id={}, name={}, url={}", monitor.getId(), monitor.getName(), monitor.getUrl());

        MonitorStatus previousStatus = monitor.getCurrentStatus();

        // Execute the health check
        HealthCheckResult result = healthCheckExecutor.execute(monitor);

        // Persist the check result
        MonitorCheckResult checkResult = MonitorCheckResult.builder()
                .monitorId(monitor.getId())
                .status(result.status())
                .httpStatus(result.httpStatus())
                .responseTimeMs(result.responseTimeMs())
                .errorMessage(result.errorMessage())
                .checkedAt(Instant.now())
                .build();
        checkResultRepository.save(checkResult);

        // Update monitor state
        MonitorStatus newStatus = result.status() == CheckStatus.UP ? MonitorStatus.UP : MonitorStatus.DOWN;
        monitor.setCurrentStatus(newStatus);
        monitor.setLastCheckedAt(Instant.now());
        monitorRepository.save(monitor);

        log.info("Monitor {} [{}]: {} (HTTP {}, {}ms)",
                monitor.getId(), monitor.getName(), result.status(),
                result.httpStatus(), result.responseTimeMs());

        // Handle notifications on state transition
        if (previousStatus != newStatus) {
            log.info("State transition for monitor {}: {} → {}", monitor.getId(), previousStatus, newStatus);
            notificationService.handleStateTransition(monitor, previousStatus, result.status(), result);
        }
    }
}

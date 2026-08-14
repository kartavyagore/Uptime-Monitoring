package com.uptimemonitor.api.service;

import com.uptimemonitor.api.dto.UptimeStatisticsResponse;
import com.uptimemonitor.common.repository.MonitorCheckResultRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class StatisticsService {

    private final MonitorCheckResultRepository checkResultRepository;

    public StatisticsService(MonitorCheckResultRepository checkResultRepository) {
        this.checkResultRepository = checkResultRepository;
    }

    /**
     * Returns uptime statistics for standard time periods:
     * last hour, last 24 hours, last 7 days, last 30 days.
     */
    @Transactional(readOnly = true)
    public List<UptimeStatisticsResponse> getStatistics(UUID monitorId) {
        Instant now = Instant.now();
        return List.of(
                computeForPeriod(monitorId, "1h", now.minus(Duration.ofHours(1)), now),
                computeForPeriod(monitorId, "24h", now.minus(Duration.ofHours(24)), now),
                computeForPeriod(monitorId, "7d", now.minus(Duration.ofDays(7)), now),
                computeForPeriod(monitorId, "30d", now.minus(Duration.ofDays(30)), now)
        );
    }

    private UptimeStatisticsResponse computeForPeriod(UUID monitorId, String period, Instant since, Instant now) {
        long totalChecks = checkResultRepository.countByMonitorIdAndCheckedAtAfter(monitorId, since);
        long successfulChecks = checkResultRepository.countSuccessfulChecks(monitorId, since);
        long failedChecks = totalChecks - successfulChecks;

        double uptimePercentage = totalChecks > 0
                ? (double) successfulChecks / totalChecks * 100.0
                : 0.0;

        double avgResponseTime = totalChecks > 0
                ? checkResultRepository.avgResponseTime(monitorId, since)
                : 0.0;

        long minResponseTime = totalChecks > 0
                ? checkResultRepository.minResponseTime(monitorId, since)
                : 0;

        long maxResponseTime = totalChecks > 0
                ? checkResultRepository.maxResponseTime(monitorId, since)
                : 0;

        // Estimate downtime: failed checks × average interval (rough approximation)
        // More precise calculation would require analyzing consecutive DOWN periods
        long periodSeconds = Duration.between(since, now).toSeconds();
        long totalDowntimeSeconds = totalChecks > 0
                ? (long) ((double) failedChecks / totalChecks * periodSeconds)
                : 0;

        return new UptimeStatisticsResponse(
                period,
                Math.round(uptimePercentage * 100.0) / 100.0, // round to 2 decimal places
                totalChecks,
                successfulChecks,
                failedChecks,
                Math.round(avgResponseTime * 100.0) / 100.0,
                minResponseTime,
                maxResponseTime,
                totalDowntimeSeconds
        );
    }
}

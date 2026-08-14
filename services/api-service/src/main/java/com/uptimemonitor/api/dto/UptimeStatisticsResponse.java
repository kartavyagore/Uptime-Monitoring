package com.uptimemonitor.api.dto;

public record UptimeStatisticsResponse(
        String period,
        double uptimePercentage,
        long totalChecks,
        long successfulChecks,
        long failedChecks,
        double avgResponseTimeMs,
        long minResponseTimeMs,
        long maxResponseTimeMs,
        long totalDowntimeSeconds
) {
}

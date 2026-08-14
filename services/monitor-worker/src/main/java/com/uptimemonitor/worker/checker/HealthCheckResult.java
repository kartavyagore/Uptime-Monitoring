package com.uptimemonitor.worker.checker;

import com.uptimemonitor.common.enums.CheckStatus;

/**
 * Immutable result of a single health check execution.
 */
public record HealthCheckResult(
        CheckStatus status,
        Integer httpStatus,
        Long responseTimeMs,
        String errorMessage
) {
    public static HealthCheckResult up(int httpStatus, long responseTimeMs) {
        return new HealthCheckResult(CheckStatus.UP, httpStatus, responseTimeMs, null);
    }

    public static HealthCheckResult up(int httpStatus, long responseTimeMs, String details) {
        return new HealthCheckResult(CheckStatus.UP, httpStatus, responseTimeMs, details);
    }

    public static HealthCheckResult down(Integer httpStatus, Long responseTimeMs, String errorMessage) {
        return new HealthCheckResult(CheckStatus.DOWN, httpStatus, responseTimeMs, errorMessage);
    }

    public static HealthCheckResult error(String errorMessage) {
        return new HealthCheckResult(CheckStatus.DOWN, null, null, errorMessage);
    }
}

package com.uptimemonitor.api.dto;

import com.uptimemonitor.common.entity.Monitor;

import java.time.Instant;
import java.util.UUID;

public record MonitorResponse(
        UUID id,
        String name,
        String url,
        String httpMethod,
        int expectedStatusCode,
        int intervalSeconds,
        int timeoutMs,
        boolean enabled,
        String currentStatus,
        Instant lastCheckedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static MonitorResponse from(Monitor monitor) {
        return new MonitorResponse(
                monitor.getId(),
                monitor.getName(),
                monitor.getUrl(),
                monitor.getHttpMethod().name(),
                monitor.getExpectedStatusCode(),
                monitor.getIntervalSeconds(),
                monitor.getTimeoutMs(),
                monitor.getEnabled(),
                monitor.getCurrentStatus().name(),
                monitor.getLastCheckedAt(),
                monitor.getCreatedAt(),
                monitor.getUpdatedAt()
        );
    }
}

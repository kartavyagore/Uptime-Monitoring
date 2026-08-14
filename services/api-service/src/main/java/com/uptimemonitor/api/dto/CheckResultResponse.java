package com.uptimemonitor.api.dto;

import com.uptimemonitor.common.entity.MonitorCheckResult;

import java.time.Instant;

public record CheckResultResponse(
        Long id,
        String status,
        Integer httpStatus,
        Long responseTimeMs,
        String errorMessage,
        Instant checkedAt
) {
    public static CheckResultResponse from(MonitorCheckResult result) {
        return new CheckResultResponse(
                result.getId(),
                result.getStatus().name(),
                result.getHttpStatus(),
                result.getResponseTimeMs(),
                result.getErrorMessage(),
                result.getCheckedAt()
        );
    }
}

package com.uptimemonitor.common.entity;

import com.uptimemonitor.common.enums.CheckStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "monitor_check_results", indexes = {
        @Index(name = "idx_check_results_monitor_id", columnList = "monitor_id"),
        @Index(name = "idx_check_results_checked_at", columnList = "checked_at"),
        @Index(name = "idx_check_results_monitor_checked", columnList = "monitor_id, checked_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonitorCheckResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "monitor_id", nullable = false)
    private UUID monitorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CheckStatus status;

    @Column(name = "http_status")
    private Integer httpStatus;

    @Column(name = "response_time_ms")
    private Long responseTimeMs;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "checked_at", nullable = false)
    private Instant checkedAt;
}

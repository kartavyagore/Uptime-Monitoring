package com.uptimemonitor.common.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Tracks notification events for deduplication and audit.
 * Prevents repeated notifications for the same state.
 */
@Entity
@Table(name = "notification_events", indexes = {
        @Index(name = "idx_notification_events_monitor_id", columnList = "monitor_id"),
        @Index(name = "idx_notification_events_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "monitor_id", nullable = false)
    private UUID monitorId;

    /** DOWN or RECOVERY */
    @Column(nullable = false, length = 20)
    private String type;

    /** EMAIL, SLACK, WEBHOOK (future) */
    @Column(nullable = false, length = 20)
    private String channel;

    @Column(nullable = false, length = 320)
    private String recipient;

    /** SENT, FAILED */
    @Column(nullable = false, length = 10)
    private String status;

    @Column(name = "error_message", length = 2048)
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}

-- ============================================================
-- V5: Notification events (audit / deduplication)
-- ============================================================

CREATE TABLE notification_events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id    UUID         NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    type          VARCHAR(20)  NOT NULL,
    channel       VARCHAR(20)  NOT NULL,
    recipient     VARCHAR(320) NOT NULL,
    status        VARCHAR(10)  NOT NULL,
    error_message VARCHAR(2048),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_events_monitor_id  ON notification_events (monitor_id);
CREATE INDEX idx_notification_events_created_at  ON notification_events (created_at);

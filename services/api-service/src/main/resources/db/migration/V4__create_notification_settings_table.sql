-- ============================================================
-- V4: Monitor notification settings
-- One-to-one with monitors
-- ============================================================

CREATE TABLE monitor_notification_settings (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id        UUID    NOT NULL UNIQUE REFERENCES monitors(id) ON DELETE CASCADE,
    email_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    notify_on_down    BOOLEAN NOT NULL DEFAULT TRUE,
    notify_on_recovery BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

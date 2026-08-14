-- ============================================================
-- V2: Monitors table
-- Each monitor belongs to one user (FK on user_id)
-- ============================================================

CREATE TABLE monitors (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                 VARCHAR(255) NOT NULL,
    url                  VARCHAR(2048) NOT NULL,
    http_method          VARCHAR(10)  NOT NULL DEFAULT 'GET',
    expected_status_code INTEGER      NOT NULL DEFAULT 200,
    interval_seconds     INTEGER      NOT NULL DEFAULT 60,
    timeout_ms           INTEGER      NOT NULL DEFAULT 10000,
    enabled              BOOLEAN      NOT NULL DEFAULT TRUE,
    current_status       VARCHAR(10)  NOT NULL DEFAULT 'UNKNOWN',
    last_checked_at      TIMESTAMPTZ,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monitors_user_id ON monitors (user_id);
CREATE INDEX idx_monitors_enabled_status ON monitors (enabled, current_status);

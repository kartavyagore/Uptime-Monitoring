-- ============================================================
-- V3: Monitor check results table
-- Uses BIGINT id (IDENTITY) for high-volume sequential inserts
-- ============================================================

CREATE TABLE monitor_check_results (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    monitor_id       UUID         NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    status           VARCHAR(10)  NOT NULL,
    http_status      INTEGER,
    response_time_ms BIGINT,
    error_message    VARCHAR(2048),
    checked_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_check_results_monitor_id       ON monitor_check_results (monitor_id);
CREATE INDEX idx_check_results_checked_at       ON monitor_check_results (checked_at);
CREATE INDEX idx_check_results_monitor_checked  ON monitor_check_results (monitor_id, checked_at);

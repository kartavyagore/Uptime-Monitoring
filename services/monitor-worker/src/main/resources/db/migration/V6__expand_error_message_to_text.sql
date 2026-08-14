-- ============================================================
-- V6: Expand error_message column to TEXT for Actuator health details
-- ============================================================

ALTER TABLE monitor_check_results ALTER COLUMN error_message TYPE TEXT;

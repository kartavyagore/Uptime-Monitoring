# Database Schema

## Entity Relationship Diagram

```
users 1──N monitors 1──N monitor_check_results
                    1──1 monitor_notification_settings
                    1──N notification_events
```

## Tables

### users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| google_subject | VARCHAR(255) | UNIQUE, NOT NULL | Google OpenID Connect `sub` claim (stable identity) |
| email | VARCHAR(320) | UNIQUE, NOT NULL | Google email (synced on login) |
| name | VARCHAR(255) | | Display name |
| picture_url | VARCHAR(2048) | NULLABLE | Google profile picture URL |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | ACTIVE, INACTIVE, SUSPENDED |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**Note**: No `password_hash` column. Authentication is fully delegated to Google.

### monitors

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) CASCADE, NOT NULL | Owner |
| name | VARCHAR(255) | NOT NULL | Display name |
| url | VARCHAR(2048) | NOT NULL | HTTP/HTTPS endpoint to monitor |
| http_method | VARCHAR(10) | NOT NULL, DEFAULT 'GET' | GET, POST, PUT, etc. |
| expected_status_code | INTEGER | NOT NULL, DEFAULT 200 | Expected HTTP response |
| interval_seconds | INTEGER | NOT NULL, DEFAULT 60 | Check frequency |
| timeout_ms | INTEGER | NOT NULL, DEFAULT 10000 | Request timeout |
| enabled | BOOLEAN | NOT NULL, DEFAULT TRUE | Active/paused |
| current_status | VARCHAR(10) | NOT NULL, DEFAULT 'UNKNOWN' | UP, DOWN, PAUSED, UNKNOWN |
| last_checked_at | TIMESTAMPTZ | NULLABLE | Last health check time |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

### monitor_check_results

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK (IDENTITY) | Sequential for high-volume inserts |
| monitor_id | UUID | FK → monitors(id) CASCADE | |
| status | VARCHAR(10) | NOT NULL | UP or DOWN |
| http_status | INTEGER | NULLABLE | HTTP response status code |
| response_time_ms | BIGINT | NULLABLE | Response time in milliseconds |
| error_message | VARCHAR(2048) | NULLABLE | Error description if failed |
| checked_at | TIMESTAMPTZ | NOT NULL | When the check was performed |

### monitor_notification_settings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| monitor_id | UUID | FK, UNIQUE | One settings row per monitor |
| email_enabled | BOOLEAN | NOT NULL, DEFAULT TRUE | Email notifications on/off |
| notify_on_down | BOOLEAN | NOT NULL, DEFAULT TRUE | Notify on UP→DOWN transition |
| notify_on_recovery | BOOLEAN | NOT NULL, DEFAULT TRUE | Notify on DOWN→UP transition |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

### notification_events

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| monitor_id | UUID | FK | |
| type | VARCHAR(20) | NOT NULL | DOWN, RECOVERY |
| channel | VARCHAR(20) | NOT NULL | EMAIL (future: SLACK, WEBHOOK) |
| recipient | VARCHAR(320) | NOT NULL | Email address |
| status | VARCHAR(10) | NOT NULL | SENT, FAILED |
| error_message | VARCHAR(2048) | NULLABLE | Error if delivery failed |
| created_at | TIMESTAMPTZ | NOT NULL | |

## Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| users | idx_users_google_subject | google_subject | OAuth login lookup |
| users | idx_users_email | email | Email lookup |
| monitors | idx_monitors_user_id | user_id | List user's monitors |
| monitors | idx_monitors_enabled_status | enabled, current_status | Scheduler query |
| monitor_check_results | idx_check_results_monitor_id | monitor_id | Filter by monitor |
| monitor_check_results | idx_check_results_checked_at | checked_at | Time range queries |
| monitor_check_results | idx_check_results_monitor_checked | monitor_id, checked_at | Statistics aggregation |
| notification_events | idx_notification_events_monitor_id | monitor_id | Event history |
| notification_events | idx_notification_events_created_at | created_at | Time range queries |

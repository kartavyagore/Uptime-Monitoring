package com.uptimemonitor.api.policy;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Encapsulates the monitor-per-user limit as a configurable policy.
 * The limit is read from configuration so it can later be extended
 * to per-plan limits without changing business logic.
 */
@Component
public class MonitorLimitPolicy {

    private final int maxMonitorsPerUser;

    public MonitorLimitPolicy(@Value("${app.monitor.max-per-user:3}") int maxMonitorsPerUser) {
        this.maxMonitorsPerUser = maxMonitorsPerUser;
    }

    public int getMaxMonitorsPerUser() {
        return maxMonitorsPerUser;
    }

    public boolean isWithinLimit(long currentCount) {
        return currentCount < maxMonitorsPerUser;
    }
}

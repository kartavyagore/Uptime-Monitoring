package com.uptimemonitor.api.policy;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MonitorLimitPolicyTest {

    @Test
    void shouldAllowCreationBelowLimit() {
        MonitorLimitPolicy policy = new MonitorLimitPolicy(3);
        assertTrue(policy.isWithinLimit(0));
        assertTrue(policy.isWithinLimit(1));
        assertTrue(policy.isWithinLimit(2));
    }

    @Test
    void shouldRejectAtLimit() {
        MonitorLimitPolicy policy = new MonitorLimitPolicy(3);
        assertFalse(policy.isWithinLimit(3));
    }

    @Test
    void shouldRejectAboveLimit() {
        MonitorLimitPolicy policy = new MonitorLimitPolicy(3);
        assertFalse(policy.isWithinLimit(5));
    }

    @Test
    void shouldSupportCustomLimit() {
        MonitorLimitPolicy policy = new MonitorLimitPolicy(10);
        assertTrue(policy.isWithinLimit(9));
        assertFalse(policy.isWithinLimit(10));
    }

    @Test
    void shouldReturnMaxMonitorsPerUser() {
        MonitorLimitPolicy policy = new MonitorLimitPolicy(3);
        assertEquals(3, policy.getMaxMonitorsPerUser());
    }
}

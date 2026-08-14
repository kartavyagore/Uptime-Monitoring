package com.uptimemonitor.api.exception;

public class MonitorLimitExceededException extends RuntimeException {
    private final int currentCount;
    private final int maxAllowed;

    public MonitorLimitExceededException(int currentCount, int maxAllowed) {
        super(String.format("Monitor limit reached: %d/%d. Upgrade your plan to add more monitors.", currentCount, maxAllowed));
        this.currentCount = currentCount;
        this.maxAllowed = maxAllowed;
    }

    public int getCurrentCount() { return currentCount; }
    public int getMaxAllowed() { return maxAllowed; }
}

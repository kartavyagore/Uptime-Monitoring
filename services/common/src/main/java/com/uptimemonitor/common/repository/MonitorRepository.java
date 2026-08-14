package com.uptimemonitor.common.repository;

import com.uptimemonitor.common.entity.Monitor;
import com.uptimemonitor.common.enums.MonitorStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MonitorRepository extends JpaRepository<Monitor, UUID> {

    List<Monitor> findByUserId(UUID userId);

    Optional<Monitor> findByIdAndUserId(UUID id, UUID userId);

    int countByUserId(UUID userId);

    /**
     * Finds monitors that are enabled and due for checking.
     * A monitor is "due" if it has never been checked, or its last check
     * was more than interval_seconds ago.
     */
    @Query("""
            SELECT m FROM Monitor m
            WHERE m.enabled = true
              AND m.currentStatus <> :pausedStatus
              AND (m.lastCheckedAt IS NULL
                   OR m.lastCheckedAt < :cutoff)
            """)
    List<Monitor> findMonitorsDueForCheck(
            @Param("pausedStatus") MonitorStatus pausedStatus,
            @Param("cutoff") Instant cutoff
    );

    /**
     * Count active (non-deleted) monitors for a user — used for limit enforcement.
     */
    @Query("SELECT COUNT(m) FROM Monitor m WHERE m.userId = :userId")
    long countActiveMonitorsByUserId(@Param("userId") UUID userId);
}

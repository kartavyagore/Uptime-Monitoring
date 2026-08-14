package com.uptimemonitor.common.repository;

import com.uptimemonitor.common.entity.MonitorCheckResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface MonitorCheckResultRepository extends JpaRepository<MonitorCheckResult, Long> {

    Page<MonitorCheckResult> findByMonitorIdOrderByCheckedAtDesc(UUID monitorId, Pageable pageable);

    /**
     * Count total checks in a time window.
     */
    @Query("SELECT COUNT(r) FROM MonitorCheckResult r WHERE r.monitorId = :monitorId AND r.checkedAt >= :since")
    long countByMonitorIdAndCheckedAtAfter(@Param("monitorId") UUID monitorId, @Param("since") Instant since);

    /**
     * Count successful (UP) checks in a time window.
     */
    @Query("""
            SELECT COUNT(r) FROM MonitorCheckResult r
            WHERE r.monitorId = :monitorId
              AND r.checkedAt >= :since
              AND r.status = com.uptimemonitor.common.enums.CheckStatus.UP
            """)
    long countSuccessfulChecks(@Param("monitorId") UUID monitorId, @Param("since") Instant since);

    /**
     * Average response time in a time window (only successful checks).
     */
    @Query("""
            SELECT COALESCE(AVG(r.responseTimeMs), 0) FROM MonitorCheckResult r
            WHERE r.monitorId = :monitorId
              AND r.checkedAt >= :since
              AND r.status = com.uptimemonitor.common.enums.CheckStatus.UP
              AND r.responseTimeMs IS NOT NULL
            """)
    double avgResponseTime(@Param("monitorId") UUID monitorId, @Param("since") Instant since);

    /**
     * Min response time in a time window (only successful checks).
     */
    @Query("""
            SELECT COALESCE(MIN(r.responseTimeMs), 0) FROM MonitorCheckResult r
            WHERE r.monitorId = :monitorId
              AND r.checkedAt >= :since
              AND r.status = com.uptimemonitor.common.enums.CheckStatus.UP
              AND r.responseTimeMs IS NOT NULL
            """)
    long minResponseTime(@Param("monitorId") UUID monitorId, @Param("since") Instant since);

    /**
     * Max response time in a time window (only successful checks).
     */
    @Query("""
            SELECT COALESCE(MAX(r.responseTimeMs), 0) FROM MonitorCheckResult r
            WHERE r.monitorId = :monitorId
              AND r.checkedAt >= :since
              AND r.status = com.uptimemonitor.common.enums.CheckStatus.UP
              AND r.responseTimeMs IS NOT NULL
            """)
    long maxResponseTime(@Param("monitorId") UUID monitorId, @Param("since") Instant since);
}

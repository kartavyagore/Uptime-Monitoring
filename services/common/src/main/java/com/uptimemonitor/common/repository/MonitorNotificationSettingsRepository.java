package com.uptimemonitor.common.repository;

import com.uptimemonitor.common.entity.MonitorNotificationSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MonitorNotificationSettingsRepository extends JpaRepository<MonitorNotificationSettings, UUID> {

    Optional<MonitorNotificationSettings> findByMonitorId(UUID monitorId);

    void deleteByMonitorId(UUID monitorId);
}

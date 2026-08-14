package com.uptimemonitor.api.controller;

import com.uptimemonitor.api.dto.*;
import com.uptimemonitor.api.service.MonitorService;
import com.uptimemonitor.api.service.NotificationSettingsService;
import com.uptimemonitor.api.service.StatisticsService;
import com.uptimemonitor.api.service.UserService;
import com.uptimemonitor.common.entity.Monitor;
import com.uptimemonitor.common.entity.MonitorNotificationSettings;
import com.uptimemonitor.common.entity.User;
import com.uptimemonitor.common.repository.MonitorCheckResultRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/monitors")
@Tag(name = "Monitors", description = "Monitor CRUD, statistics, and notification settings")
public class MonitorController {

    private final MonitorService monitorService;
    private final StatisticsService statisticsService;
    private final NotificationSettingsService notificationSettingsService;
    private final MonitorCheckResultRepository checkResultRepository;
    private final UserService userService;

    public MonitorController(MonitorService monitorService,
                             StatisticsService statisticsService,
                             NotificationSettingsService notificationSettingsService,
                             MonitorCheckResultRepository checkResultRepository,
                             UserService userService) {
        this.monitorService = monitorService;
        this.statisticsService = statisticsService;
        this.notificationSettingsService = notificationSettingsService;
        this.checkResultRepository = checkResultRepository;
        this.userService = userService;
    }

    // ── CRUD ──────────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Create a monitor", description = "Creates a new monitor (max 3 per user)")
    public ResponseEntity<MonitorResponse> createMonitor(
            @AuthenticationPrincipal OidcUser oidcUser,
            @Valid @RequestBody CreateMonitorRequest request) {
        UUID userId = resolveUserId(oidcUser);
        Monitor monitor = monitorService.createMonitor(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(MonitorResponse.from(monitor));
    }

    @GetMapping
    @Operation(summary = "List monitors", description = "Returns all monitors for the authenticated user")
    public ResponseEntity<List<MonitorResponse>> listMonitors(@AuthenticationPrincipal OidcUser oidcUser) {
        UUID userId = resolveUserId(oidcUser);
        List<MonitorResponse> monitors = monitorService.getMonitorsByUser(userId).stream()
                .map(MonitorResponse::from)
                .toList();
        return ResponseEntity.ok(monitors);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get monitor", description = "Returns a specific monitor owned by the authenticated user")
    public ResponseEntity<MonitorResponse> getMonitor(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable UUID id) {
        UUID userId = resolveUserId(oidcUser);
        Monitor monitor = monitorService.getMonitorByIdAndUser(id, userId);
        return ResponseEntity.ok(MonitorResponse.from(monitor));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update monitor")
    public ResponseEntity<MonitorResponse> updateMonitor(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMonitorRequest request) {
        UUID userId = resolveUserId(oidcUser);
        Monitor updated = monitorService.updateMonitor(id, userId, request);
        return ResponseEntity.ok(MonitorResponse.from(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete monitor")
    public ResponseEntity<Void> deleteMonitor(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable UUID id) {
        UUID userId = resolveUserId(oidcUser);
        monitorService.deleteMonitor(id, userId);
        return ResponseEntity.noContent().build();
    }

    // ── Pause / Resume ────────────────────────────────────

    @PostMapping("/{id}/pause")
    @Operation(summary = "Pause monitor")
    public ResponseEntity<MonitorResponse> pauseMonitor(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable UUID id) {
        UUID userId = resolveUserId(oidcUser);
        Monitor paused = monitorService.pauseMonitor(id, userId);
        return ResponseEntity.ok(MonitorResponse.from(paused));
    }

    @PostMapping("/{id}/resume")
    @Operation(summary = "Resume monitor")
    public ResponseEntity<MonitorResponse> resumeMonitor(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable UUID id) {
        UUID userId = resolveUserId(oidcUser);
        Monitor resumed = monitorService.resumeMonitor(id, userId);
        return ResponseEntity.ok(MonitorResponse.from(resumed));
    }

    // ── Check Results ─────────────────────────────────────

    @GetMapping("/{id}/checks")
    @Operation(summary = "Get check results", description = "Paginated historical check results")
    public ResponseEntity<List<CheckResultResponse>> getCheckResults(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        UUID userId = resolveUserId(oidcUser);
        // Verify ownership
        monitorService.getMonitorByIdAndUser(id, userId);

        var results = checkResultRepository
                .findByMonitorIdOrderByCheckedAtDesc(id, PageRequest.of(page, Math.min(size, 100)))
                .map(CheckResultResponse::from)
                .getContent();
        return ResponseEntity.ok(results);
    }

    // ── Statistics ─────────────────────────────────────────

    @GetMapping("/{id}/statistics")
    @Operation(summary = "Get uptime statistics")
    public ResponseEntity<List<UptimeStatisticsResponse>> getStatistics(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable UUID id) {
        UUID userId = resolveUserId(oidcUser);
        monitorService.getMonitorByIdAndUser(id, userId);
        return ResponseEntity.ok(statisticsService.getStatistics(id));
    }

    // ── Notification Settings ─────────────────────────────

    @GetMapping("/{id}/notifications")
    @Operation(summary = "Get notification settings")
    public ResponseEntity<NotificationSettingsResponse> getNotificationSettings(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable UUID id) {
        UUID userId = resolveUserId(oidcUser);
        monitorService.getMonitorByIdAndUser(id, userId);
        MonitorNotificationSettings settings = notificationSettingsService.getSettings(id);
        return ResponseEntity.ok(NotificationSettingsResponse.from(settings));
    }

    @PutMapping("/{id}/notifications")
    @Operation(summary = "Update notification settings")
    public ResponseEntity<NotificationSettingsResponse> updateNotificationSettings(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateNotificationSettingsRequest request) {
        UUID userId = resolveUserId(oidcUser);
        monitorService.getMonitorByIdAndUser(id, userId);
        MonitorNotificationSettings updated = notificationSettingsService.updateSettings(id, request);
        return ResponseEntity.ok(NotificationSettingsResponse.from(updated));
    }

    // ── Helper ────────────────────────────────────────────

    /**
     * Resolves the application user ID from the authenticated OIDC principal.
     * The user is identified by their Google subject (sub claim), never from frontend input.
     */
    private UUID resolveUserId(OidcUser oidcUser) {
        String googleSubject = oidcUser.getSubject();
        User user = userService.findByGoogleSubject(googleSubject)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found in database"));
        return user.getId();
    }
}

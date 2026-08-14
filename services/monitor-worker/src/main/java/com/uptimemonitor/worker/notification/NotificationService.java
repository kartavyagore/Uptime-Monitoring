package com.uptimemonitor.worker.notification;

import com.uptimemonitor.common.entity.*;
import com.uptimemonitor.common.enums.CheckStatus;
import com.uptimemonitor.common.enums.MonitorStatus;
import com.uptimemonitor.common.repository.MonitorNotificationSettingsRepository;
import com.uptimemonitor.common.repository.NotificationEventRepository;
import com.uptimemonitor.common.repository.UserRepository;
import com.uptimemonitor.worker.checker.HealthCheckResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Notification service — handles state-transition-based email notifications.
 *
 * Transition policy:
 *   UP → DOWN       → Send DOWN notification
 *   DOWN → DOWN     → Do NOT send (deduplication)
 *   DOWN → UP       → Send RECOVERY notification
 *   UP → UP         → Do NOT send
 *   UNKNOWN → DOWN  → Send DOWN notification
 *   UNKNOWN → UP    → Do NOT send (first check is initial state, not a "recovery")
 *
 * Email failures are logged but never crash the worker.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z")
            .withZone(ZoneId.of("UTC"));

    private final EmailSender emailSender;
    private final TemplateEngine templateEngine;
    private final MonitorNotificationSettingsRepository settingsRepository;
    private final NotificationEventRepository eventRepository;
    private final UserRepository userRepository;
    private final String frontendUrl;

    public NotificationService(EmailSender emailSender,
                               TemplateEngine templateEngine,
                               MonitorNotificationSettingsRepository settingsRepository,
                               NotificationEventRepository eventRepository,
                               UserRepository userRepository,
                               @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl) {
        this.emailSender = emailSender;
        this.templateEngine = templateEngine;
        this.settingsRepository = settingsRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.frontendUrl = frontendUrl;
    }

    /**
     * Evaluate whether a notification should be sent based on the state transition.
     */
    public void handleStateTransition(Monitor monitor, MonitorStatus previousStatus,
                                       CheckStatus newCheckStatus, HealthCheckResult result) {
        // Load notification settings
        var settings = settingsRepository.findByMonitorId(monitor.getId()).orElse(null);
        if (settings == null || !settings.getEmailEnabled()) {
            log.debug("Notifications disabled for monitor {}", monitor.getId());
            return;
        }

        // Determine if this is a notifiable transition
        boolean isDown = newCheckStatus == CheckStatus.DOWN;
        boolean wasDown = previousStatus == MonitorStatus.DOWN;
        boolean wasUnknown = previousStatus == MonitorStatus.UNKNOWN;
        boolean wasUp = previousStatus == MonitorStatus.UP;

        if (isDown && !wasDown) {
            // UP/UNKNOWN → DOWN: Send DOWN notification
            if (settings.getNotifyOnDown()) {
                sendDownNotification(monitor, result);
            }
        } else if (!isDown && wasDown) {
            // DOWN → UP: Send RECOVERY notification
            if (settings.getNotifyOnRecovery()) {
                sendRecoveryNotification(monitor, result);
            }
        }
        // UP → UP, DOWN → DOWN, UNKNOWN → UP: No notification
    }

    private void sendDownNotification(Monitor monitor, HealthCheckResult result) {
        try {
            String recipientEmail = resolveRecipientEmail(monitor);
            if (recipientEmail == null) return;

            Context ctx = buildEmailContext(monitor, result);
            String html = templateEngine.process("monitor-down", ctx);
            String subject = "🔴 Monitor DOWN: " + monitor.getName();

            emailSender.send(recipientEmail, subject, html);
            recordEvent(monitor, "DOWN", "EMAIL", recipientEmail, "SENT", null);
            log.info("DOWN notification sent for monitor {} to {}", monitor.getId(), recipientEmail);

        } catch (Exception e) {
            log.error("Failed to send DOWN notification for monitor {}: {}", monitor.getId(), e.getMessage());
            recordEvent(monitor, "DOWN", "EMAIL", "unknown", "FAILED", e.getMessage());
        }
    }

    private void sendRecoveryNotification(Monitor monitor, HealthCheckResult result) {
        try {
            String recipientEmail = resolveRecipientEmail(monitor);
            if (recipientEmail == null) return;

            Context ctx = buildEmailContext(monitor, result);
            String html = templateEngine.process("monitor-recovery", ctx);
            String subject = "🟢 Monitor RECOVERED: " + monitor.getName();

            emailSender.send(recipientEmail, subject, html);
            recordEvent(monitor, "RECOVERY", "EMAIL", recipientEmail, "SENT", null);
            log.info("RECOVERY notification sent for monitor {} to {}", monitor.getId(), recipientEmail);

        } catch (Exception e) {
            log.error("Failed to send RECOVERY notification for monitor {}: {}", monitor.getId(), e.getMessage());
            recordEvent(monitor, "RECOVERY", "EMAIL", "unknown", "FAILED", e.getMessage());
        }
    }

    private String resolveRecipientEmail(Monitor monitor) {
        return userRepository.findById(monitor.getUserId())
                .map(User::getEmail)
                .orElseGet(() -> {
                    log.warn("User not found for monitor {}, cannot send notification", monitor.getId());
                    return null;
                });
    }

    private Context buildEmailContext(Monitor monitor, HealthCheckResult result) {
        Context ctx = new Context();
        ctx.setVariable("monitorName", monitor.getName());
        ctx.setVariable("endpoint", monitor.getUrl());
        ctx.setVariable("httpStatus", result.httpStatus());
        ctx.setVariable("responseTimeMs", result.responseTimeMs());
        ctx.setVariable("errorMessage", result.errorMessage());
        ctx.setVariable("timestamp", FORMATTER.format(Instant.now()));
        ctx.setVariable("dashboardUrl", frontendUrl + "/monitors/" + monitor.getId());
        return ctx;
    }

    private void recordEvent(Monitor monitor, String type, String channel, String recipient,
                             String status, String errorMessage) {
        try {
            NotificationEvent event = NotificationEvent.builder()
                    .monitorId(monitor.getId())
                    .type(type)
                    .channel(channel)
                    .recipient(recipient)
                    .status(status)
                    .errorMessage(errorMessage)
                    .build();
            eventRepository.save(event);
        } catch (Exception e) {
            log.error("Failed to record notification event: {}", e.getMessage());
        }
    }
}

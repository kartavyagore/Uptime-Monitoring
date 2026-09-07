package com.uptimemonitor.api.service;

import com.uptimemonitor.common.entity.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z")
            .withZone(ZoneId.of("UTC"));

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final String fromAddress;
    private final String frontendUrl;
    private final String smtpHost;
    private final int smtpPort;

    public EmailService(JavaMailSender mailSender,
                        TemplateEngine templateEngine,
                        @Value("${app.mail.from:kartavyagore0@gmail.com}") String fromAddress,
                        @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl,
                        @Value("${spring.mail.host:smtp.gmail.com}") String smtpHost,
                        @Value("${spring.mail.port:587}") int smtpPort) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.fromAddress = fromAddress;
        this.frontendUrl = frontendUrl;
        this.smtpHost = smtpHost;
        this.smtpPort = smtpPort;
    }

    /**
     * Asynchronously sends a welcome email when a client signs up on the website.
     */
    @Async
    public void sendWelcomeEmail(User user) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            log.warn("Cannot send welcome email: user or email is null");
            return;
        }

        try {
            log.info("Sending welcome email to {}", user.getEmail());

            Context ctx = new Context();
            ctx.setVariable("userName", user.getName() != null ? user.getName() : "there");
            ctx.setVariable("userEmail", user.getEmail());
            ctx.setVariable("dashboardUrl", frontendUrl + "/dashboard");

            String html = templateEngine.process("welcome", ctx);
            sendHtmlEmail(user.getEmail(), "⚡ Welcome to UptimeWatch — Website Availability Monitoring", html);

            log.info("Successfully sent welcome email to {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}: {}", user.getEmail(), e.getMessage(), e);
        }
    }

    /**
     * Asynchronously sends a sign-in security notification email when a client logs into the website.
     */
    @Async
    public void sendLoginNotificationEmail(User user) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            log.warn("Cannot send login alert: user or email is null");
            return;
        }

        try {
            log.info("Sending login notification email to {}", user.getEmail());

            Context ctx = new Context();
            ctx.setVariable("userName", user.getName() != null ? user.getName() : "there");
            ctx.setVariable("userEmail", user.getEmail());
            ctx.setVariable("timestamp", FORMATTER.format(Instant.now()));
            ctx.setVariable("dashboardUrl", frontendUrl + "/dashboard");

            String html = templateEngine.process("login-alert", ctx);
            sendHtmlEmail(user.getEmail(), "🔐 UptimeWatch: New sign-in to your account", html);

            log.info("Successfully sent login notification email to {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send login notification email to {}: {}", user.getEmail(), e.getMessage(), e);
        }
    }

    /**
     * Sends a test email to verify that Gmail SMTP credentials and network connection work.
     * Synchronous so caller gets immediate confirmation or failure reasons.
     */
    public void sendTestEmail(User user) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            throw new IllegalArgumentException("User email cannot be empty for test email");
        }

        log.info("Sending test email to {}", user.getEmail());

        Context ctx = new Context();
        ctx.setVariable("userName", user.getName() != null ? user.getName() : "Admin");
        ctx.setVariable("userEmail", user.getEmail());
        ctx.setVariable("smtpHost", smtpHost + ":" + smtpPort);
        ctx.setVariable("fromAddress", fromAddress);
        ctx.setVariable("timestamp", FORMATTER.format(Instant.now()));
        ctx.setVariable("dashboardUrl", frontendUrl + "/dashboard");

        String html = templateEngine.process("test-email", ctx);
        sendHtmlEmail(user.getEmail(), "✅ UptimeWatch: Gmail SMTP Verification Test", html);

        log.info("Successfully sent test email to {}", user.getEmail());
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("SMTP delivery failed: " + e.getMessage(), e);
        }
    }
}

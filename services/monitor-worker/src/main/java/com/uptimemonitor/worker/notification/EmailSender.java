package com.uptimemonitor.worker.notification;

/**
 * Abstraction for sending emails — implementation-agnostic.
 * Swap SmtpEmailSender for SES, SendGrid, etc. without changing business logic.
 */
public interface EmailSender {

    /**
     * Send an email.
     *
     * @param to       recipient email address
     * @param subject  email subject
     * @param htmlBody HTML email body
     * @throws EmailSendException if sending fails
     */
    void send(String to, String subject, String htmlBody);

    class EmailSendException extends RuntimeException {
        public EmailSendException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

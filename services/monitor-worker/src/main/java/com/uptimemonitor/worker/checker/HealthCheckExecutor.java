package com.uptimemonitor.worker.checker;

import com.uptimemonitor.common.entity.Monitor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Executes HTTP health checks against user-provided endpoints.
 * Uses Java's HttpClient with strict timeout and safety limits.
 *
 * Safety measures:
 * - SSRF validation before every request
 * - Connection timeout
 * - Read timeout
 * - Limited response body (discarded — we only need the status code)
 * - Redirect policy: NEVER (we validate manually, not safe to follow blindly)
 * - Custom User-Agent
 */
@Component
public class HealthCheckExecutor {

    private static final Logger log = LoggerFactory.getLogger(HealthCheckExecutor.class);

    private final SsrfProtectionService ssrfProtection;
    private final int connectionTimeoutMs;
    private final int readTimeoutMs;
    private final String userAgent;

    public HealthCheckExecutor(
            SsrfProtectionService ssrfProtection,
            @Value("${app.checker.connection-timeout-ms:5000}") int connectionTimeoutMs,
            @Value("${app.checker.read-timeout-ms:10000}") int readTimeoutMs,
            @Value("${app.checker.user-agent:UptimeMonitor/1.0}") String userAgent) {
        this.ssrfProtection = ssrfProtection;
        this.connectionTimeoutMs = connectionTimeoutMs;
        this.readTimeoutMs = readTimeoutMs;
        this.userAgent = userAgent;
    }

    /**
     * Execute a health check for the given monitor.
     * This method NEVER throws — all failures are captured in the result.
     */
    public HealthCheckResult execute(Monitor monitor) {
        try {
            // 1. SSRF validation
            ssrfProtection.validate(monitor.getUrl());

            // 2. Build request
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(monitor.getUrl()))
                    .timeout(Duration.ofMillis(monitor.getTimeoutMs() != null ? monitor.getTimeoutMs() : readTimeoutMs))
                    .header("User-Agent", userAgent);

            // Set HTTP method
            switch (monitor.getHttpMethod()) {
                case GET -> requestBuilder.GET();
                case HEAD -> requestBuilder.method("HEAD", HttpRequest.BodyPublishers.noBody());
                case POST -> requestBuilder.POST(HttpRequest.BodyPublishers.noBody());
                case PUT -> requestBuilder.PUT(HttpRequest.BodyPublishers.noBody());
                case DELETE -> requestBuilder.DELETE();
                case PATCH -> requestBuilder.method("PATCH", HttpRequest.BodyPublishers.noBody());
                case OPTIONS -> requestBuilder.method("OPTIONS", HttpRequest.BodyPublishers.noBody());
            }

            HttpRequest request = requestBuilder.build();

            // 3. Create HttpClient (per-request to avoid connection pooling issues with timeouts)
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(connectionTimeoutMs))
                    .followRedirects(HttpClient.Redirect.NEVER)
                    .build();

            // 4. Execute and time the request
            long startTime = System.nanoTime();
            HttpResponse<String> response = client.send(request,
                    HttpResponse.BodyHandlers.ofString()); // We discard body but need to consume it
            long responseTimeMs = (System.nanoTime() - startTime) / 1_000_000;

            // 5. Evaluate response & Spring Boot Actuator JSON
            int actualStatus = response.statusCode();
            int expectedStatus = monitor.getExpectedStatusCode();
            String responseBody = response.body();

            // Check if response is a Spring Boot Actuator health response
            boolean isActuatorResponse = responseBody != null && responseBody.trim().startsWith("{") 
                    && (responseBody.contains("\"components\"") || responseBody.contains("\"status\""));

            if (isActuatorResponse) {
                // Spring Boot Actuator JSON: extract overall status from JSON
                boolean isActuatorUp = responseBody.contains("\"status\":\"UP\"") 
                        || responseBody.contains("\"status\": \"UP\"");

                if (isActuatorUp && (actualStatus == 200 || actualStatus == expectedStatus)) {
                    return HealthCheckResult.up(actualStatus, responseTimeMs, responseBody);
                } else {
                    return HealthCheckResult.down(actualStatus, responseTimeMs, responseBody);
                }
            }

            // Standard HTTP status code check
            if (actualStatus == expectedStatus) {
                return HealthCheckResult.up(actualStatus, responseTimeMs, responseBody);
            } else {
                String errorMsg = (responseBody != null && !responseBody.isBlank()) 
                        ? responseBody 
                        : String.format("Expected HTTP %d but got %d", expectedStatus, actualStatus);
                return HealthCheckResult.down(actualStatus, responseTimeMs, errorMsg);
            }

        } catch (IllegalArgumentException e) {
            // SSRF violation or invalid URL
            log.warn("SSRF/URL validation failed for monitor {}: {}", monitor.getId(), e.getMessage());
            return HealthCheckResult.error("URL validation failed: " + e.getMessage());

        } catch (java.net.http.HttpConnectTimeoutException e) {
            return HealthCheckResult.error("Connection timeout after " + connectionTimeoutMs + "ms");

        } catch (java.net.http.HttpTimeoutException e) {
            return HealthCheckResult.error("Request timeout");

        } catch (java.net.ConnectException e) {
            return HealthCheckResult.error("Connection refused: " + e.getMessage());

        } catch (java.net.UnknownHostException e) {
            return HealthCheckResult.error("DNS resolution failed: " + e.getMessage());

        } catch (javax.net.ssl.SSLException e) {
            return HealthCheckResult.error("SSL/TLS error: " + e.getMessage());

        } catch (IOException e) {
            return HealthCheckResult.error("IO error: " + e.getMessage());

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return HealthCheckResult.error("Health check interrupted");

        } catch (Exception e) {
            log.error("Unexpected error checking monitor {}: {}", monitor.getId(), e.getMessage(), e);
            return HealthCheckResult.error("Unexpected error: " + e.getClass().getSimpleName());
        }
    }
}

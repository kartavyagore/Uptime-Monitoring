package com.uptimemonitor.worker.checker;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class SsrfProtectionServiceTest {

    private final SsrfProtectionService ssrfProtection = new SsrfProtectionService();

    // ── Allowed URLs ──────────────────────────────────────

    @Test
    void shouldAllowPublicHttpUrl() {
        assertDoesNotThrow(() -> ssrfProtection.validate("https://www.google.com"));
    }

    @Test
    void shouldAllowPublicHttpsUrl() {
        assertDoesNotThrow(() -> ssrfProtection.validate("https://api.github.com/status"));
    }

    // ── Blocked protocols ─────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {
            "ftp://example.com",
            "file:///etc/passwd",
            "gopher://evil.com",
            "javascript:alert(1)"
    })
    void shouldBlockNonHttpProtocols(String url) {
        assertThrows(IllegalArgumentException.class, () -> ssrfProtection.validate(url));
    }

    // ── Blocked hostnames ─────────────────────────────────

    @Test
    void shouldBlockLocalhost() {
        assertThrows(IllegalArgumentException.class, () -> ssrfProtection.validate("http://localhost"));
    }

    @Test
    void shouldBlockLocalhostSubdomain() {
        assertThrows(IllegalArgumentException.class, () -> ssrfProtection.validate("http://evil.localhost"));
    }

    @Test
    void shouldBlockGoogleMetadataHostname() {
        assertThrows(IllegalArgumentException.class,
                () -> ssrfProtection.validate("http://metadata.google.internal"));
    }

    // ── Blocked IPs ───────────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {
            "http://127.0.0.1",
            "http://127.0.0.1:8080",
            "http://10.0.0.1",
            "http://10.255.255.255",
            "http://172.16.0.1",
            "http://172.31.255.255",
            "http://192.168.0.1",
            "http://192.168.1.1",
            "http://169.254.169.254",          // AWS metadata
            "http://169.254.169.254/latest/meta-data/",
            "http://0.0.0.0"
    })
    void shouldBlockPrivateIps(String url) {
        assertThrows(IllegalArgumentException.class, () -> ssrfProtection.validate(url));
    }

    // ── Blocked IPv6 ──────────────────────────────────────

    @Test
    void shouldBlockIpv6Loopback() {
        assertThrows(IllegalArgumentException.class, () -> ssrfProtection.validate("http://[::1]"));
    }

    // ── Invalid URLs ──────────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {
            "",
            "not-a-url",
            "://missing-scheme.com"
    })
    void shouldRejectInvalidUrls(String url) {
        assertThrows(IllegalArgumentException.class, () -> ssrfProtection.validate(url));
    }
}

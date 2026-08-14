package com.uptimemonitor.worker.checker;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;

/**
 * SSRF protection — blocks requests to private/internal networks.
 *
 * Blocked ranges:
 *   - 127.0.0.0/8       (loopback)
 *   - 10.0.0.0/8        (private)
 *   - 172.16.0.0/12     (private)
 *   - 192.168.0.0/16    (private)
 *   - 169.254.0.0/16    (link-local, includes AWS metadata 169.254.169.254)
 *   - 0.0.0.0/8         (current network)
 *   - ::1               (IPv6 loopback)
 *   - fc00::/7          (IPv6 unique local)
 *   - fe80::/10         (IPv6 link-local)
 *
 * Also blocks:
 *   - Non-HTTP(S) protocols
 *   - Hostnames resolving to private IPs (DNS rebinding mitigation)
 */
@Component
public class SsrfProtectionService {

    private static final Logger log = LoggerFactory.getLogger(SsrfProtectionService.class);

    /**
     * Validates that a URL is safe to request (not targeting internal resources).
     *
     * @throws IllegalArgumentException if the URL targets a blocked resource
     */
    public void validate(String urlString) {
        URI uri;
        try {
            uri = URI.create(urlString);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid URL: " + urlString);
        }

        // 1. Protocol check
        String scheme = uri.getScheme();
        if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
            throw new IllegalArgumentException("Only HTTP and HTTPS protocols are allowed");
        }

        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("URL must have a valid hostname");
        }

        // 2. Blocked hostnames
        String lowerHost = host.toLowerCase();
        if (lowerHost.equals("localhost") || lowerHost.endsWith(".localhost")) {
            throw new IllegalArgumentException("Requests to localhost are not allowed");
        }
        if (lowerHost.equals("metadata.google.internal")) {
            throw new IllegalArgumentException("Requests to cloud metadata endpoints are not allowed");
        }

        // 3. Resolve DNS and check IP
        try {
            InetAddress[] addresses = InetAddress.getAllByName(host);
            for (InetAddress addr : addresses) {
                if (isBlockedAddress(addr)) {
                    throw new IllegalArgumentException(
                            "URL resolves to a blocked IP address: " + addr.getHostAddress());
                }
            }
        } catch (UnknownHostException e) {
            throw new IllegalArgumentException("Cannot resolve hostname: " + host);
        }
    }

    private boolean isBlockedAddress(InetAddress addr) {
        // Loopback (127.x.x.x, ::1)
        if (addr.isLoopbackAddress()) return true;

        // Link-local (169.254.x.x, fe80::/10) — includes AWS metadata endpoint
        if (addr.isLinkLocalAddress()) return true;

        // Site-local / private (10.x, 172.16-31.x, 192.168.x, fc00::/7)
        if (addr.isSiteLocalAddress()) return true;

        // Any local address (0.0.0.0)
        if (addr.isAnyLocalAddress()) return true;

        // Multicast
        if (addr.isMulticastAddress()) return true;

        byte[] bytes = addr.getAddress();

        // IPv4 specific checks
        if (bytes.length == 4) {
            // 169.254.169.254 (AWS/cloud metadata) — already covered by isLinkLocalAddress
            // but explicit check for documentation
            if ((bytes[0] & 0xFF) == 169 && (bytes[1] & 0xFF) == 254) return true;

            // 0.0.0.0/8
            if (bytes[0] == 0) return true;
        }

        // IPv6 specific checks
        if (bytes.length == 16) {
            // Unique local (fc00::/7)
            if ((bytes[0] & 0xFE) == 0xFC) return true;

            // IPv4-mapped IPv6 — check the embedded IPv4 address
            boolean isV4Mapped = true;
            for (int i = 0; i < 10; i++) {
                if (bytes[i] != 0) { isV4Mapped = false; break; }
            }
            if (isV4Mapped && (bytes[10] & 0xFF) == 0xFF && (bytes[11] & 0xFF) == 0xFF) {
                // Extract embedded IPv4
                byte[] v4 = new byte[]{bytes[12], bytes[13], bytes[14], bytes[15]};
                try {
                    InetAddress v4Addr = InetAddress.getByAddress(v4);
                    return isBlockedAddress(v4Addr);
                } catch (UnknownHostException e) {
                    return true; // Err on the side of caution
                }
            }
        }

        return false;
    }
}

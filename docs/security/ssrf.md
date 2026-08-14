# SSRF Threat Model

## Overview

The Uptime Monitor allows users to provide arbitrary URLs for health checking. This creates a Server-Side Request Forgery (SSRF) attack surface where a malicious user could attempt to:

1. **Scan internal networks** by targeting private IP ranges
2. **Access cloud metadata** endpoints (e.g., AWS `169.254.169.254`)
3. **Probe internal services** running on localhost or private hosts
4. **Exfiltrate data** through DNS or HTTP channels
5. **Bypass firewalls** by using the server as a proxy

## Blocked Address Ranges

| Range | Description |
|-------|-------------|
| `127.0.0.0/8` | IPv4 loopback |
| `10.0.0.0/8` | Private (Class A) |
| `172.16.0.0/12` | Private (Class B) |
| `192.168.0.0/16` | Private (Class C) |
| `169.254.0.0/16` | Link-local (includes AWS metadata) |
| `0.0.0.0/8` | Current network |
| `::1` | IPv6 loopback |
| `fc00::/7` | IPv6 unique local |
| `fe80::/10` | IPv6 link-local |
| IPv4-mapped IPv6 | `::ffff:127.0.0.1` etc. |

## Blocked Hostnames

- `localhost`
- `*.localhost`
- `metadata.google.internal`

## Allowed Protocols

- `http://` ✅
- `https://` ✅
- Everything else ❌ (ftp, file, gopher, etc.)

## Implementation

The SSRF protection is implemented in `SsrfProtectionService` (`services/monitor-worker/src/main/java/com/uptimemonitor/worker/checker/SsrfProtectionService.java`).

### Validation Steps

1. **Protocol check** — Only HTTP/HTTPS allowed
2. **Hostname blocklist** — Reject localhost and known metadata hostnames
3. **DNS resolution** — Resolve hostname to IP addresses
4. **IP validation** — Check all resolved IPs against blocked ranges
5. **IPv4-mapped IPv6** — Extract and validate embedded IPv4 addresses

### DNS Rebinding Mitigation

DNS resolution happens at validation time, before the HTTP connection. The resolved IPs are checked against blocked ranges. However, DNS rebinding attacks could return a safe IP during validation and a malicious IP during the actual connection.

**Current mitigation**: The Java HttpClient resolves DNS independently, so there's a theoretical window. For production hardening, consider:
- Pinning resolved IPs to the HTTP connection
- Using a DNS-over-HTTPS resolver with caching
- Network-level egress filtering

### Redirect Safety

The `HealthCheckExecutor` sets `HttpClient.Redirect.NEVER`. Redirects are not followed because:
- A redirect could point to a private IP
- Each redirect target would need SSRF validation
- For uptime monitoring, a redirect itself may be significant information

## Request Safety Limits

| Parameter | Default | Description |
|-----------|---------|-------------|
| Connection timeout | 5000ms | Max time to establish TCP connection |
| Read timeout | 10000ms | Max time to receive response |
| Max response body | 1MB | Response body is consumed but size-limited |
| Max redirects | 0 | Redirects not followed |
| User-Agent | `UptimeMonitor/1.0` | Identifies the monitoring agent |

## Cloud Metadata Protection

Even though the application initially runs locally, cloud metadata endpoint protection is implemented because:
- The application will be deployed to AWS (ECS/Fargate)
- Metadata endpoints expose IAM credentials and instance information
- This is the highest-severity SSRF target in cloud environments

### Protected Endpoints

- `169.254.169.254` (AWS EC2 metadata, also Azure, GCP)
- `metadata.google.internal` (GCP metadata hostname)
- The entire `169.254.0.0/16` range is blocked (link-local)

## Recommendations for Production

1. **Network-level egress filtering** — VPC security groups and NACLs should restrict outbound traffic from the worker
2. **IMDSv2** — When deployed on AWS, use IMDSv2 (token-required) metadata service
3. **IAM least privilege** — Worker IAM role should have minimal permissions
4. **DNS resolution pinning** — Consider custom DNS resolution to prevent rebinding
5. **URL allowlisting** — For enterprise deployments, consider domain allowlists
6. **Rate limiting** — Prevent abuse of the monitoring endpoint

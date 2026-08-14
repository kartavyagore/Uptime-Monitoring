# Architecture Overview

## Service Architecture

The Uptime Monitor platform uses a **pragmatic 2-service architecture** — consolidating auth/API/CRUD into a single API service while keeping the health-check worker separate. This follows KISS while maintaining clean separation of concerns.

### Why 2 Services (Not 4)?

The original design considered 4 services (API Gateway, Auth Service, Monitor Service, Worker). We consolidated to 2 because:

1. **Shared database** — All services access the same PostgreSQL instance. Separate services would be a distributed monolith.
2. **Session sharing** — Google OAuth sessions need to be accessible to all API endpoints. Splitting auth creates session management complexity.
3. **No inter-service calls** — With 4 services, the API gateway would need to proxy every request, adding latency with zero benefit.
4. **Future extraction** — Package-level separation (`com.uptimemonitor.api.auth.*`, `com.uptimemonitor.api.service.*`) makes future service extraction straightforward.

### Services

#### API Service (port 8080)
- **Google OAuth 2.0 / OpenID Connect**: Login, callback, user provisioning, session management
- **Monitor CRUD**: Create, read, update, delete monitors with ownership enforcement
- **Statistics**: Uptime %, response time stats for multiple time windows
- **Notification Settings**: Per-monitor email notification configuration
- **API Documentation**: OpenAPI / Swagger UI

#### Monitor Worker (port 8083)
- **Health Check Scheduler**: Spring `@Scheduled` that finds monitors due for checking
- **Health Check Executor**: Java HttpClient with strict timeouts and safety limits
- **SSRF Protection**: Blocks private IPs, localhost, cloud metadata endpoints
- **State Transition Detection**: UP→DOWN, DOWN→UP triggers notifications
- **Email Notifications**: Thymeleaf templates via SMTP (Mailpit for dev)

### Communication Pattern

```
Browser → Frontend (3000) → API Service (8080) → PostgreSQL
                                                     ↑
Monitor Worker (8083) ──── reads monitors due ────────┘
                     ──── writes check results ───────┘
                     ──── sends emails ──── Mailpit (1025)
```

Both services share the same database. No inter-service HTTP calls. The worker reads from and writes to the database independently.

## Future Architecture (AWS)

```
EventBridge Scheduler → SQS → Monitor Worker (ECS/Fargate)
                                      ↓
                                 RDS PostgreSQL
                                      ↓
                                 Amazon SES
```

The current Spring `@Scheduled` approach can be replaced with EventBridge + SQS without changing the health check or notification logic.

## Security Architecture

- **Authentication**: Google is the identity provider. No passwords stored.
- **Identity**: Users identified by Google `sub` claim (immutable), not email.
- **Sessions**: Server-side, HttpOnly, SameSite=Lax cookies.
- **Authorization**: Every API request resolves user from session; ownership verified server-side.
- **SSRF**: URL validation blocks private/internal/metadata addresses before HTTP requests.

## Technology Choices

| Choice | Rationale |
|--------|-----------|
| Session-based auth (not JWT) | Simpler, server-side revocation, no token storage on client |
| UUID userId on Monitor (not JPA relationship) | Loose coupling for future service extraction |
| Flyway (not Hibernate DDL) | Explicit, versioned schema management |
| Java HttpClient (not WebClient) | Simpler blocking calls for health checks, adequate for MVP |
| Thymeleaf (for email) | Clean HTML templating, no frontend framework needed |
| PostgreSQL IDENTITY for check results | High-volume sequential inserts perform better than UUID |

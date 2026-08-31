# Uptime Monitor

A production-grade website and API uptime monitoring SaaS platform built with Java Spring Boot microservices and a Next.js frontend.

## Architecture

```
Browser → Next.js Frontend (3000)
              ↓
         API Service (8080)  ←  Spring Boot + Google OAuth + Monitor CRUD + Statistics
              ↓
         Monitor Worker (8083)  ←  Health Checks + SSRF Protection + Email Notifications
              ↓
         PostgreSQL (5432)  +  Mailpit (1025/8025)
```

**2 backend services** (KISS principle):
- **API Service** — Google OAuth 2.0, user management, monitor CRUD, statistics, notification settings
- **Monitor Worker** — Scheduled health checks, SSRF protection, state transitions, email notifications

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 21, Spring Boot 3.3, Spring Security, Spring Data JPA, Hibernate |
| Auth | Google OAuth 2.0 / OpenID Connect (no passwords, no JWT) |
| Database | PostgreSQL 16, Flyway migrations |
| Email | Spring Mail + Mailpit (dev), provider-agnostic abstraction |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Infrastructure | Docker, Docker Compose |

## Prerequisites

- Java 21+ (JDK)
- Node.js 18+
- Docker & Docker Compose
- Google OAuth 2.0 credentials ([create here](https://console.cloud.google.com/apis/credentials))

## Quick Start (Docker Compose — Recommended)

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Google OAuth credentials
# Authorized redirect URI: http://localhost:8080/login/oauth2/code/google
```

### 2. Start Full Stack

```bash
docker compose up -d --build
```

This starts all 5 containers with automatic dependency ordering, health checks, and database migrations:
- **Frontend**: http://localhost:3000
- **API Service**: http://localhost:8080 (Swagger: http://localhost:8080/swagger-ui.html)
- **Monitor Worker**: http://localhost:8083 (Actuator: http://localhost:8083/actuator/health)
- **Mailpit Web UI**: http://localhost:8025
- **Mailpit SMTP**: localhost:1025
- **PostgreSQL**: localhost:5432

### 3. Use the Application

1. Open http://localhost:3000
2. Click "Continue with Google"
3. Sign in with your Google account
4. Create a monitor (up to 3)
5. Watch health checks run automatically
6. Check Mailpit (http://localhost:8025) for email alerts

---

## Alternative: Manual Local Development

### 1. Start Infrastructure Only
```bash
docker compose up -d postgres mailpit
```

### 2. Start Backend (API Service)
```bash
cd services
mvnw spring-boot:run -pl api-service
```

### 3. Start Backend (Monitor Worker)
```bash
cd services
mvnw spring-boot:run -pl monitor-worker
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

## Build & Test

```bash
cd services
mvnw clean test        # Unit + integration tests (uses Testcontainers)
mvnw clean package     # Build all JARs
```

## Project Structure

```
├── frontend/               Next.js app
├── services/
│   ├── common/             Shared JPA entities, repositories, enums
│   ├── api-service/        REST API, OAuth, CRUD, statistics
│   └── monitor-worker/     Health checks, scheduling, email
├── docs/
│   ├── architecture/       Architecture documentation
│   ├── database/           Schema documentation
│   └── security/           SSRF threat model
├── docker-compose.yml      PostgreSQL + Mailpit
└── .env.example            Configuration template
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/auth/login` | Initiate Google OAuth login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/monitors` | Create monitor (max 3) |
| GET | `/api/monitors` | List user's monitors |
| GET | `/api/monitors/{id}` | Get monitor details |
| PUT | `/api/monitors/{id}` | Update monitor |
| DELETE | `/api/monitors/{id}` | Delete monitor |
| POST | `/api/monitors/{id}/pause` | Pause monitor |
| POST | `/api/monitors/{id}/resume` | Resume monitor |
| GET | `/api/monitors/{id}/checks?page=0&size=50` | Check history |
| GET | `/api/monitors/{id}/statistics` | Uptime statistics |
| GET | `/api/monitors/{id}/notifications` | Notification settings |
| PUT | `/api/monitors/{id}/notifications` | Update notifications |

## Security

- **Authentication**: Google OAuth 2.0 / OpenID Connect only (no passwords stored)
- **Identity**: Users identified by Google `sub` claim (stable, not email)
- **Sessions**: Server-side sessions (no JWT)
- **Ownership**: Every monitor request enforces user ownership server-side
- **SSRF**: Blocks private IPs, localhost, cloud metadata endpoints
- **Secrets**: Environment variables only, never committed to Git

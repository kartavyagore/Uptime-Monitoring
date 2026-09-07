# 1. Setup Environment
cp .env.example .env

# Configure Google OAuth 2.0 credentials in .env:
# GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=your-client-secret

# 2. Run Entire Full Stack (Frontend + Backend + Database + Mail)
docker compose up -d --build

# ── Service Endpoints ──────────────────────────────────────────────
# • Frontend:       http://localhost:3000
# • API Service:    http://localhost:8080
# • Swagger Docs:   http://localhost:8080/swagger-ui.html
# • Monitor Worker: http://localhost:8083/actuator/health
# • Gmail SMTP:     smtp.gmail.com:587 (Real email delivery)
# • PostgreSQL:     localhost:5432


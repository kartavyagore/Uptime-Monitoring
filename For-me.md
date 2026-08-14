cp .env.example .env

# ----- Google OAuth 2.0 -----
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

docker-compose up -d postgres mailpit
// localhost:5432 psql and localhost:1025 SMTP mailpit and localhost:8025 email web ui

cd services
mvn clean install -DskipTests

cd services/api-service
mvn spring-boot:run
// localhost:8080 api service

cd services/monitor-worker
mvn spring-boot:run
// localhost:8083 monitor worker service

cd frontend
npm install
npm run dev
// localhost:3000 frontend

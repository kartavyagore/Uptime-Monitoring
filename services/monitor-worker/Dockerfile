FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /build

# Copy parent and module POMs first for dependency caching
COPY pom.xml ./pom.xml
COPY common/pom.xml ./common/pom.xml
COPY api-service/pom.xml ./api-service/pom.xml
COPY monitor-worker/pom.xml ./monitor-worker/pom.xml

# Download dependencies (cached layer)
RUN mvn dependency:go-offline -B -pl monitor-worker -am || true

# Copy source code and build
COPY common/src ./common/src
COPY monitor-worker/src ./monitor-worker/src
RUN mvn package -B -pl monitor-worker -am -DskipTests

# ── Runtime ──────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY --from=build /build/monitor-worker/target/*.jar app.jar

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8083
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://localhost:8083/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]

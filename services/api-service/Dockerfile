FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /build

# Copy parent and common module first for better layer caching
COPY pom.xml ./pom.xml
COPY common/pom.xml ./common/pom.xml
COPY common/src ./common/src
COPY api-service/pom.xml ./api-service/pom.xml
COPY monitor-worker/pom.xml ./monitor-worker/pom.xml

# Download dependencies (cached layer)
RUN apk add --no-cache maven && \
    mvn dependency:go-offline -pl api-service -am -q || true

# Copy source and build
COPY api-service/src ./api-service/src
RUN mvn package -pl api-service -am -DskipTests -q

# ── Runtime ──────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY --from=build /build/api-service/target/*.jar app.jar

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]

FROM gradle:9.2.1-jdk25 as builder
USER root
WORKDIR /builder
COPY . /builder
RUN gradle bootJar --stacktrace

FROM eclipse-temurin:25-jre-alpine
EXPOSE 8080
WORKDIR /app
COPY --from=builder /builder/release/ihne.jar ihne.jar
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "ihne.jar"]
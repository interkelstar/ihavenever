FROM gradle:6.8.0-jdk11 as builder
USER root
WORKDIR /builder
ADD . /builder
RUN gradle bootJar --stacktrace

FROM openjdk:11-jre-slim
EXPOSE 8080
WORKDIR /app
COPY --from=builder /builder/release/*.jar ihne.jar
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "ihne.jar"]
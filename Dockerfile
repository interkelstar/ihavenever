FROM gradle:6.7.0-jdk8 as builder
USER root
WORKDIR /builder
ADD . /builder
RUN gradle bootJar --stacktrace

FROM openjdk:8-jre-alpine
EXPOSE 8080
WORKDIR /app
COPY --from=builder /builder/release/*.jar ihne.jar
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "ihne.jar"]
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY target/scheduler-service-*.jar app.jar

EXPOSE 8002

ENTRYPOINT ["java", "-jar", "app.jar"]

<<<<<<< HEAD
FROM openjdk:17-jdk-slim
=======
FROM eclipse-temurin:17-jdk
>>>>>>> main

WORKDIR /app

# Copy Maven files
COPY pom.xml .
COPY src ./src

# Install Maven
<<<<<<< HEAD
RUN apt-get update && \
    apt-get install -y maven
=======
RUN apt-get update && apt-get install -y --no-install-recommends maven curl && rm -rf /var/lib/apt/lists/*
>>>>>>> main

# Build the application
RUN mvn clean package -DskipTests

# Run the application
EXPOSE 8080

CMD ["java", "-jar", "target/utility-service-1.0.0.jar"]

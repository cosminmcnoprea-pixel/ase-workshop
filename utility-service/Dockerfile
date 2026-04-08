FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Copy Maven files
COPY pom.xml .
COPY src ./src

# Install Maven
RUN apk add --no-cache maven curl

# Build the application
RUN mvn clean package -DskipTests

# Run the application
EXPOSE 8080

CMD ["java", "-jar", "target/utility-service-1.0.0.jar"]

# DevTask Hub Utility Service

## 📋 Descriere

Microserviciu Java utilitar pentru DevTask Hub care oferă funcționalități avansate de analiză, căutare și notificări prin email.

## 🚀 Funcționalități

### 📊 Analytics & Statistics
- **Task Statistics** - Număr total de task-uri, completate, în progres, pending
- **Notification Statistics** - Statistici despre notificări (citite/necitite, tipuri)
- **Performance Metrics** - Metrici de sistem și performanță baze de date
- **Dashboard Summary** - Rezumat complet al tuturor statisticilor

### 🔍 Advanced Search
- **Full-text Search** - Căutare în titlu și descriere task-uri
- **Filtered Search** - Filtrare după prioritate, status, dată
- **Search Suggestions** - Sugestii de căutare în timp real
- **Recent Searches** - Istoric căutări recente

### 📧 Email Notifications
- **Task Reminders** - Email-uri de reminder pentru task-uri
- **Daily Summaries** - Rapoarte zilnice prin email
- **Custom Templates** - Template-uri personalizabile pentru email-uri

## 🏗️ Arhitectură

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend    │    │  Task Service  │    │ Notification    │
│   (React)     │    │   (Python)     │    │   Service       │
└─────────┬─────┘    └─────────┬─────┘    └─────────┬─────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                    ┌─────────┴─────────┐
                    │ Utility Service    │
                    │    (Java)        │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │  PostgreSQL DB    │
                    │   (Shared)        │
                    └───────────────────┘
```

## 🛠️ Tech Stack

- **Java 17** - Platforma de bază
- **Spring Boot 3.2.5** - Framework principal
- **Spring Data JPA** - Acces la baza de date
- **PostgreSQL** - Baza de date partajată
- **Maven** - Management dependențe
- **Docker** - Containerizare
- **JUnit 5** - Testare unitară

## 📁 Structură Proiect

```
utility-service/
├── src/
│   └── main/
│       ├── java/com/devtaskhub/utility/
│       │   ├── controller/          # API Endpoints
│       │   │   ├── AnalyticsController.java
│       │   │   ├── SearchController.java
│       │   │   └── EmailController.java
│       │   ├── service/             # Business Logic
│       │   │   ├── AnalyticsService.java
│       │   │   ├── SearchService.java
│       │   │   └── EmailService.java
│       │   └── dto/                # Data Transfer Objects
│       │       ├── TaskStatisticsDTO.java
│       │       ├── NotificationStatisticsDTO.java
│       │       ├── SearchRequestDTO.java
│       │       ├── SearchResultDTO.java
│       │       ├── TaskSearchResultDTO.java
│       │       └── EmailRequestDTO.java
│       └── resources/
│           └── application.properties   # Configuration
├── pom.xml                     # Maven Configuration
├── Dockerfile                   # Docker Configuration
└── README.md                   # Documentation
```

## 🔧 API Endpoints

### Analytics API
```
GET  /api/analytics/tasks/statistics       # Statistici task-uri
GET  /api/analytics/notifications/statistics # Statistici notificări
GET  /api/analytics/performance/metrics     # Metrici performanță
GET  /api/analytics/dashboard/summary        # Rezumat dashboard
```

### Search API
```
POST /api/search/tasks           # Căutare task-uri
GET  /api/search/tasks/suggestions # Sugestii căutare
GET  /api/search/tasks/recent     # Căutări recente
```

### Email API
```
POST /api/email/send             # Trimitere email
POST /api/email/task-reminder   # Reminder task
POST /api/email/daily-summary    # Sumar zilnic
GET  /api/email/templates        # Template-uri email
```

## 🐳 Docker Deployment

```bash
# Build Docker image
docker build -t utility-service .

# Run container
docker run -p 8080:8080 \
  -e DATABASE_URL=jdbc:postgresql://postgres:postgres@postgres:5432/devtaskhub \
  -e EMAIL_USERNAME=your-email@gmail.com \
  -e EMAIL_PASSWORD=your-app-password \
  utility-service
```

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL` - Connection string PostgreSQL
- `EMAIL_USERNAME` - Gmail username
- `EMAIL_PASSWORD` - Gmail app password

### Database Connection
- **Host**: postgres (Docker network)
- **Port**: 5432
- **Database**: devtaskhub
- **Username**: postgres
- **Password**: postgres

## 🧪 Testare

```bash
# Run tests
mvn test

# Run with coverage
mvn clean test jacoco:report
```

## 📊 Exemple de Utilizare

### Obținere Statistici Task-uri
```bash
curl -X GET http://localhost:8080/api/analytics/tasks/statistics
```

**Response:**
```json
{
  "totalTasks": 25,
  "completedTasks": 15,
  "inProgressTasks": 5,
  "todoTasks": 5,
  "highPriorityTasks": 8,
  "mediumPriorityTasks": 10,
  "lowPriorityTasks": 7,
  "completionRate": 60.0,
  "generatedAt": "2026-04-08T15:30:00"
}
```

### Căutare Avansată
```bash
curl -X POST http://localhost:8080/api/search/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "query": "database",
    "priority": "high",
    "status": "in-progress",
    "limit": 10
  }'
```

### Trimitere Email Reminder
```bash
curl -X POST http://localhost:8080/api/email/task-reminder \
  -d "taskId=task-123&recipient=user@example.com"
```

## 🔗 Integrare cu DevTask Hub

Acest microserviciu se integrează cu arhitectura existentă:

1. **Partajează baza de date** PostgreSQL cu celelalte servicii
2. **Comunică** cu task-service și notification-service
3. **Oferă API REST** pentru frontend React
4. **Monitorizează** performanța întregului sistem

## 🚀 Deployment în GCP

### Cloud Run Configuration
```yaml
# gcp-deployment.yml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: utility-service
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "1000m"
    spec:
      containers:
      - image: gcr.io/aseworkshop/utility-service
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          value: "postgresql://postgres:postgres@10.0.0.5:5432/devtaskhub"
```

## 📈 Monitorizare

- **Health Check**: `/actuator/health`
- **Metrics**: `/actuator/metrics`
- **Info**: `/actuator/info`
- **Custom Metrics**: Performance tracking în timp real

## 🔮 Future Enhancements

- [ ] **WebSocket Support** - Real-time notifications
- [ ] **Caching** - Redis pentru performanță
- [ ] **Rate Limiting** - Protecție API
- [ ] **Advanced Analytics** - Trend analysis
- [ ] **Export/Import** - Data management
- [ ] **Machine Learning** - Smart recommendations

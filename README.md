# DevOpsTask Hub

A microservices-based task management application built to demonstrate **Software Development Life Cycle (SDLC)** and **DevOps** principles in practice.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Services in Detail](#services-in-detail)
  - [Task Service (Python/FastAPI)](#1-task-service--pythonfastapi)
  - [Notification Service (Node.js/Express)](#2-notification-service--nodejsexpress)
  - [Frontend (React/Vite)](#3-frontend--reactvite)
- [Running Locally with Docker Compose](#running-locally-with-docker-compose)
- [CI/CD Pipelines (GitHub Actions)](#cicd-pipelines-github-actions)
- [SDLC Concepts Applied](#sdlc-concepts-applied)
- [DevOps Concepts Applied](#devops-concepts-applied)
- [API Reference](#api-reference)
- [How to Extend This Project](#how-to-extend-this-project)

---

## Architecture Overview

```
                           ┌─────────────────────────┐
                           │       Frontend           │
                           │    React + Vite + Nginx   │
                           │       Port 3000           │
                           └────┬───────────┬──────────┘
                                │           │
                    REST API    │           │    REST API
                   (fetch)      │           │   (fetch)
                                ▼           ▼
               ┌────────────────────┐  ┌──────────────────────┐
               │   Task Service     │  │ Notification Service  │
               │  Python / FastAPI  │  │  Node.js / Express    │
               │    Port 8000       │  │    Port 3001          │
               │                    │  │                       │
               │  - CRUD for tasks  │  │  - Create alerts      │
               │  - In-memory store │  │  - List notifications │
               │  - Health check    │  │  - Mark as read       │
               └────────────────────┘  └──────────────────────┘
```

**How the services communicate:**

1. The **Frontend** runs in the user's browser and makes HTTP requests to both backend services.
2. When a user creates, completes, or deletes a task, the Frontend calls the **Task Service** to persist the change, then calls the **Notification Service** to log the event.
3. Each service is **independent** — they don't call each other directly. The Frontend acts as the orchestrator.
4. All three services expose a `/health` endpoint. The Frontend polls these to show live status indicators (green/red dots in the footer).

---

## Project Structure

```
ase-workshop/
├── docker-compose.yml                # Orchestrates all 3 services
├── .gitignore                        # Git ignore rules
├── README.md                         # This file
│
├── task-service/                     # Python microservice
│   ├── main.py                       # FastAPI application (CRUD endpoints)
│   ├── requirements.txt              # Python dependencies
│   ├── Dockerfile                    # Container image definition
│   ├── .dockerignore                 # Files excluded from Docker build
│   └── tests/
│       └── test_main.py              # Unit tests (pytest)
│
├── notification-service/             # Node.js microservice
│   ├── server.js                     # Express application (notification endpoints)
│   ├── package.json                  # Node.js dependencies and scripts
│   ├── Dockerfile                    # Container image definition
│   ├── .dockerignore                 # Files excluded from Docker build
│   └── tests/
│       └── test_server.js            # Unit tests (Node.js test runner)
│
├── frontend/                         # React single-page application
│   ├── src/
│   │   ├── App.jsx                   # Main UI component (task dashboard)
│   │   └── main.jsx                  # React entry point
│   ├── index.html                    # HTML shell
│   ├── vite.config.js                # Vite build configuration
│   ├── package.json                  # Frontend dependencies
│   ├── nginx.conf                    # Production web server config
│   ├── Dockerfile                    # Multi-stage build (build + serve)
│   └── .dockerignore                 # Files excluded from Docker build
│
└── .github/
    └── workflows/
        ├── task-service.yml          # CI/CD pipeline for Task Service
        ├── notification-service.yml  # CI/CD pipeline for Notification Service
        └── frontend.yml              # CI/CD pipeline for Frontend
```

---

## Services in Detail

### 1. Task Service — Python/FastAPI

**Location:** `task-service/`
**Port:** 8000
**Language:** Python 3.12
**Framework:** FastAPI

This service manages the lifecycle of tasks (create, read, update, delete). It uses an **in-memory dictionary** as its data store, meaning data resets when the service restarts. In a production system, you'd replace this with a database like PostgreSQL or MongoDB.

**Key concepts demonstrated:**
- **REST API design** — standard HTTP methods (GET, POST, PATCH, DELETE) with proper status codes (201 for created, 204 for deleted, 404 for not found)
- **Data validation** — Pydantic models (`TaskCreate`, `Task`) validate incoming JSON automatically
- **CORS middleware** — allows the frontend (running on a different port) to make cross-origin requests
- **Health check endpoint** — `/health` returns service status, used by Docker and the frontend to monitor availability

**Dockerfile explained:**
```dockerfile
FROM python:3.12-slim          # Start from a minimal Python image
WORKDIR /app                   # Set the working directory inside the container
COPY requirements.txt .        # Copy dependencies list first (Docker layer caching)
RUN pip install -r requirements.txt  # Install dependencies (cached if requirements unchanged)
COPY . .                       # Copy application code
EXPOSE 8000                    # Document which port the app uses
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]  # Start the server
```

> **Why copy requirements.txt before the code?** Docker builds in layers. If the code changes but dependencies don't, Docker reuses the cached dependency layer instead of reinstalling everything. This makes builds much faster.

---

### 2. Notification Service — Node.js/Express

**Location:** `notification-service/`
**Port:** 3001
**Language:** Node.js 20
**Framework:** Express

This service acts as a simple event log. When things happen in the app (task created, completed, deleted), the frontend sends a notification here. It stores the last 50 notifications in memory.

**Key concepts demonstrated:**
- **Separation of concerns** — notifications are a separate service from tasks, each with its own codebase, dependencies, and deployment lifecycle
- **Input validation** — rejects requests without a `message` field (400 Bad Request)
- **Stateless design** — uses in-memory array, could be swapped for Redis or a message queue in production

**Dockerfile explained:**
```dockerfile
FROM node:20-alpine            # Alpine = minimal Linux image (~50MB vs ~350MB for full)
WORKDIR /app
COPY package*.json ./          # Copy package.json and package-lock.json
RUN npm install --production   # Install only production dependencies (no devDependencies)
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

---

### 3. Frontend — React/Vite

**Location:** `frontend/`
**Port:** 3000 (production via nginx) / 5173 (development via Vite)
**Language:** JavaScript (JSX)
**Framework:** React 18 + Vite

The frontend is a single-page application that provides the user interface. It communicates with both backend services via `fetch()` API calls.

**Features:**
- Create tasks with title, description, and priority (low/medium/high)
- Toggle task status through the workflow: `todo` → `in-progress` → `done`
- Delete tasks
- View notifications in a dropdown panel (bell icon with unread count)
- Live health indicators showing if backend services are reachable

**Multi-stage Dockerfile explained:**
```dockerfile
# Stage 1: BUILD — compile the React app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_TASK_API_URL=http://localhost:8000      # Build-time variable
ARG VITE_NOTIFICATION_API_URL=http://localhost:3001
RUN npm run build              # Produces static files in /app/dist

# Stage 2: SERVE — serve with nginx (production web server)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html  # Copy built files from stage 1
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

> **Why multi-stage builds?** The build stage has Node.js, npm, and all dev dependencies (~300MB+). The final image only contains nginx and the compiled static files (~25MB). This results in a much smaller, faster, and more secure production image.

---

## Running Locally with Docker Compose

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Start everything

```bash
docker compose up --build -d
```

This single command:
1. **Builds** Docker images for all 3 services
2. **Creates** a Docker network so containers can communicate
3. **Starts** Task Service and Notification Service first
4. **Waits** for health checks to pass (services must respond to `/health`)
5. **Starts** the Frontend only after both backends are healthy

### Verify services are running

```bash
# Check container status
docker compose ps

# Test backend health
curl http://localhost:8000/health    # Task Service
curl http://localhost:3001/health    # Notification Service

# Open the UI
open http://localhost:3000           # Frontend
```

### View logs

```bash
docker compose logs -f                    # All services
docker compose logs -f task-service       # Single service
```

### Stop everything

```bash
docker compose down
```

### Docker Compose explained

```yaml
services:
  task-service:
    build: ./task-service              # Build from the Dockerfile in this directory
    ports:
      - "8000:8000"                    # Map host port 8000 → container port 8000
    healthcheck:                       # Docker periodically checks if the service is alive
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 10s                    # Check every 10 seconds
      timeout: 5s                      # Fail if no response in 5 seconds
      retries: 3                       # Mark unhealthy after 3 consecutive failures

  notification-service:
    build: ./notification-service
    ports:
      - "3001:3001"
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3001/health"]
      interval: 10s
      timeout: 5s
      retries: 3

  frontend:
    build:
      context: ./frontend
      args:                            # Pass environment variables at build time
        VITE_TASK_API_URL: http://localhost:8000
        VITE_NOTIFICATION_API_URL: http://localhost:3001
    ports:
      - "3000:80"                      # Nginx serves on port 80 inside container
    depends_on:                        # Start order + health requirements
      task-service:
        condition: service_healthy     # Wait for Task Service to be healthy
      notification-service:
        condition: service_healthy     # Wait for Notification Service to be healthy
```

---

## CI/CD Pipelines (GitHub Actions)

Each service has its own pipeline defined in `.github/workflows/`. Pipelines are **path-filtered** — they only run when files in the relevant service directory change.

### Pipeline: Task Service (`.github/workflows/task-service.yml`)

```
Push/PR to main (task-service/**)
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│   Test Job       │────▶│   Build Job       │
│                  │     │ (main branch only)│
│ - Setup Python   │     │                   │
│ - Install deps   │     │ - Docker Buildx   │
│ - Lint (compile) │     │ - Build image     │
│ - Run pytest     │     │ - (Push to GHCR)  │
└─────────────────┘     └──────────────────┘
```

**Key concepts:**
- **`needs: test`** — the Build job only runs if the Test job passes (dependency chain)
- **`if: github.ref == 'refs/heads/main'`** — Docker images are only built on pushes to main, not on PRs
- **Path filtering** (`paths: ['task-service/**']`) — changes to the frontend won't trigger the task-service pipeline
- **Dependency caching** (`cache: 'pip'`) — speeds up CI by reusing downloaded packages

### Pipeline: Notification Service (`.github/workflows/notification-service.yml`)

Same structure as Task Service but for Node.js:
- Uses `actions/setup-node@v4` instead of Python
- Runs `npm test` using Node.js built-in test runner

### Pipeline: Frontend (`.github/workflows/frontend.yml`)

- **Build job** — installs dependencies and runs `npm run build` (Vite compilation)
- **Docker job** — builds the multi-stage Docker image with build-time arguments

### Enabling Container Registry Push (optional)

The pipelines include commented-out steps for pushing images to **GitHub Container Registry (GHCR)**. To enable:

1. Uncomment the login and push steps in the workflow files
2. The `GITHUB_TOKEN` secret is automatically available in GitHub Actions
3. Images will be pushed as `ghcr.io/<your-org>/<your-repo>/service-name:latest`

---

## SDLC Concepts Applied

This project demonstrates a modern SDLC in action. Here's how each phase maps to what we built:

### 1. Planning

Before writing code, we defined:
- **What to build** — a task management app with notifications
- **Architecture** — microservices pattern with 3 independent services
- **Tech stack** — chosen based on the strengths of each technology (FastAPI for rapid API development, Express for lightweight event handling, React for interactive UIs)

### 2. Design

- **API contracts** — each service has well-defined REST endpoints (see [API Reference](#api-reference))
- **Separation of concerns** — tasks and notifications are separate bounded contexts
- **Communication pattern** — the frontend orchestrates calls to both services (no direct service-to-service calls in this simple version)
- **Data models** — defined with Pydantic (Python) and plain objects (JavaScript)

### 3. Implementation (Coding)

- **Task Service** (`task-service/main.py`) — 70 lines of Python implementing a full CRUD API
- **Notification Service** (`notification-service/server.js`) — 54 lines of JavaScript for event logging
- **Frontend** (`frontend/src/App.jsx`) — single-component React app with state management
- Each service is self-contained with its own dependencies, configuration, and entry point

### 4. Testing

- **Task Service** — `pytest` tests covering all 5 endpoints (health, create, list, update, delete, not-found cases)
- **Notification Service** — Node.js built-in test runner covering health, creation, listing, and input validation
- Tests run automatically in CI pipelines on every push and pull request
- Tests use real HTTP clients (`TestClient` for FastAPI, `fetch` for Express) rather than mocking

```bash
# Run tests locally
cd task-service && pip install -r requirements.txt && pytest tests/ -v
cd notification-service && npm install && npm test
```

### 5. Deployment

- **Containerization** — each service is packaged into a Docker image with a reproducible `Dockerfile`
- **Orchestration** — `docker-compose.yml` defines how services start together with health checks and dependencies
- **CI/CD pipelines** — GitHub Actions automate testing and building on every code change
- **Infrastructure as Code** — the entire deployment is defined in version-controlled files (Dockerfiles, docker-compose.yml, workflow YAMLs)

### 6. Operations & Monitoring

- **Health checks** — every service exposes `/health`, monitored by Docker and displayed in the UI
- **Logging** — `docker compose logs` aggregates logs from all services
- **Container management** — `docker compose ps` shows running status, resource usage

### 7. Iteration

The project is designed for easy iteration:
- Change one service without affecting others
- CI/CD pipelines only trigger for changed services (path filtering)
- Add new services by creating a new directory + Dockerfile + workflow file

---

## DevOps Concepts Applied

| Concept | How It's Applied |
|---------|-----------------|
| **Containerization** | Each service has a `Dockerfile` that packages the app with its runtime, making it portable across environments |
| **Container Orchestration** | `docker-compose.yml` manages multi-container deployments with networking, health checks, and startup ordering |
| **CI/CD** | GitHub Actions automatically test and build on every push — no manual steps needed |
| **Infrastructure as Code** | All infrastructure is defined in files (`Dockerfile`, `docker-compose.yml`, `.github/workflows/`) tracked in Git |
| **Microservices** | The app is split into 3 independent services, each with its own language, framework, and deployment lifecycle |
| **Health Checks** | Services expose `/health` endpoints; Docker monitors them; the UI displays live status |
| **Multi-stage Builds** | Frontend Dockerfile uses 2 stages to produce a minimal production image (build → serve) |
| **Path-filtered Pipelines** | CI/CD only runs for the service that changed, saving time and resources |
| **Dependency Caching** | GitHub Actions caches pip/npm packages across runs to speed up pipelines |
| **Image Tagging** | Docker images are tagged with the Git commit SHA for traceability (`service:abc123f`) |
| **Environment Configuration** | API URLs are configurable via environment variables (`VITE_TASK_API_URL`) — same code, different configs |
| **Layer Caching** | Dockerfiles are structured to maximize layer reuse (copy dependencies before code) |

---

## API Reference

### Task Service (port 8000)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `GET` | `/health` | Health check | — | `{"status": "healthy", "service": "task-service"}` |
| `GET` | `/tasks` | List all tasks | — | `[Task, ...]` |
| `POST` | `/tasks` | Create a task | `{"title": "...", "description": "...", "priority": "low\|medium\|high"}` | `Task` (201) |
| `GET` | `/tasks/:id` | Get a single task | — | `Task` or 404 |
| `PATCH` | `/tasks/:id` | Update a task | `{"status": "done", ...}` | `Task` or 404 |
| `DELETE` | `/tasks/:id` | Delete a task | — | 204 or 404 |

**Task object:**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "priority": "low | medium | high",
  "status": "todo | in-progress | done",
  "created_at": "ISO 8601 datetime"
}
```

> FastAPI also auto-generates interactive API documentation at **http://localhost:8000/docs** (Swagger UI).

### Notification Service (port 3001)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `GET` | `/health` | Health check | — | `{"status": "healthy", "service": "notification-service"}` |
| `GET` | `/notifications` | List all notifications | — | `[Notification, ...]` |
| `POST` | `/notifications` | Create notification | `{"message": "...", "type": "info\|success\|warning", "taskId": "..."}` | `Notification` (201) |
| `PATCH` | `/notifications/:id/read` | Mark as read | — | `Notification` or 404 |
| `DELETE` | `/notifications` | Clear all | — | 204 |

**Notification object:**
```json
{
  "id": "string",
  "message": "string",
  "type": "info | success | warning",
  "taskId": "string | null",
  "read": false,
  "createdAt": "ISO 8601 datetime"
}
```

---

## How to Extend This Project

Here are ideas to practice more SDLC/DevOps concepts:

1. **Add a database** — Replace in-memory storage with PostgreSQL or MongoDB. Add a `db` service in `docker-compose.yml`. Practice data persistence and migrations.

2. **Add service-to-service communication** — Have the Task Service call the Notification Service directly (instead of the frontend doing it). This introduces concepts like service discovery and API gateways.

3. **Add environment-specific configs** — Create `docker-compose.dev.yml` and `docker-compose.prod.yml` overrides. Practice environment management.

4. **Add a reverse proxy** — Put nginx or Traefik in front of all services as an API gateway. Route `/api/tasks` and `/api/notifications` through a single entry point.

5. **Add monitoring** — Integrate Prometheus metrics and a Grafana dashboard. Add a `monitoring` service to Docker Compose.

6. **Add logging infrastructure** — Ship logs to the ELK stack (Elasticsearch + Logstash + Kibana) or Loki + Grafana.

7. **Deploy to the cloud** — Push images to GHCR and deploy to AWS ECS, Google Cloud Run, or a Kubernetes cluster.

8. **Add integration tests** — Write tests that spin up all services and test the full user flow end-to-end.

9. **Add branch protection** — Configure GitHub branch rules to require passing CI checks before merging PRs.

10. **Add secrets management** — Use GitHub Secrets and environment variables for database credentials, API keys, etc.

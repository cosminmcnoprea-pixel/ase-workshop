# Cloud Run Deployment Guide

This guide explains how to deploy the DevTask Hub application to Google Cloud Run for internet exposure.

## Prerequisites

1. **Google Cloud Project** with billing enabled
2. **gcloud CLI** installed and configured
3. **Docker** installed locally

## Setup

### 1. Configure Google Cloud

```bash
# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### 2. Configure GitHub Secrets

Add these secrets to your GitHub repository:

- `GCP_PROJECT_ID`: Your Google Cloud Project ID
- `WIF_PROVIDER`: Workload Identity Provider
- `WIF_SERVICE_ACCOUNT`: Service Account Email

### 3. Manual Deployment

```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy to your project
./deploy.sh YOUR_PROJECT_ID
```

### 4. Automated Deployment (GitHub Actions)

Push to `main` branch to trigger automatic deployment via GitHub Actions workflow.

## Architecture

The application consists of three microservices:

1. **Frontend** (React/Vite + Nginx)
   - Public URL: `https://devtask-hub-PROJECT_HASH.us-central1.run.app`
   - Port: 80

2. **Task Service** (FastAPI)
   - Public URL: `https://task-service-PROJECT_HASH.us-central1.run.app`
   - Port: 8000

3. **Notification Service** (Node.js/Express)
   - Public URL: `https://notification-service-PROJECT_HASH.us-central1.run.app`
   - Port: 3001

## Features

- **In-memory storage** (no database required)
- **Task CRUD operations** with edit functionality
- **Real-time notifications**
- **Health checks** for all services
- **Automatic HTTPS** via Cloud Run
- **Auto-scaling** based on traffic

## Environment Variables

Frontend build-time variables:
- `VITE_TASK_API_URL`: Task service endpoint
- `VITE_NOTIFICATION_API_URL`: Notification service endpoint

## Cost Optimization

- Frontend: 512Mi memory, 1 CPU
- Task Service: 256Mi memory, 1 CPU  
- Notification Service: 256Mi memory, 1 CPU
- All services allow unauthenticated access
- Container concurrency: 80

## Monitoring

Check service health:
```bash
# Frontend
curl https://your-app-url.us-central1.run.app

# Task Service
curl https://task-service-url.us-central1.run.app/health

# Notification Service  
curl https://notification-service-url.us-central1.run.app/health
```

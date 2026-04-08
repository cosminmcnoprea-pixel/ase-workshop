#!/bin/bash

# Cloud Run Deployment Script
# Usage: ./deploy.sh [PROJECT_ID]

set -e

PROJECT_ID=${1:-$(gcloud config get-value project)}
REGION="us-central1"
REPOSITORY="devtask-hub"

echo "Deploying to project: $PROJECT_ID"

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Create Artifact Registry repository
gcloud artifacts repositories create $REPOSITORY \
    --repository-format=docker \
    --location=$REGION \
    --description="DevTask Hub container images"

# Build and push images
echo "Building and pushing Docker images..."

# Task Service
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/task-service:latest ./task-service
docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/task-service:latest

# Notification Service
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/notification-service:latest ./notification-service
docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/notification-service:latest

# Frontend
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/frontend:latest \
    --build-arg VITE_TASK_API_URL=https://task-service-$PROJECT_ID.uc.r.appspot.com \
    --build-arg VITE_NOTIFICATION_API_URL=https://notification-service-$PROJECT_ID.uc.r.appspot.com \
    ./frontend
docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/frontend:latest

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."

# Deploy Frontend
gcloud run deploy devtask-hub \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/frontend:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --port=80 \
    --memory=512Mi \
    --cpu=1 \
    --set-env-vars=VITE_TASK_API_URL=https://task-service-$PROJECT_ID.uc.r.appspot.com,VITE_NOTIFICATION_API_URL=https://notification-service-$PROJECT_ID.uc.r.appspot.com

# Deploy Task Service
gcloud run deploy task-service \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/task-service:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --port=8000 \
    --memory=256Mi \
    --cpu=1

# Deploy Notification Service
gcloud run deploy notification-service \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/notification-service:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --port=3001 \
    --memory=256Mi \
    --cpu=1

# Get URLs
FRONTEND_URL=$(gcloud run services describe devtask-hub --region=$REGION --format='value(status.url)')
TASK_URL=$(gcloud run services describe task-service --region=$REGION --format='value(status.url)')
NOTIF_URL=$(gcloud run services describe notification-service --region=$REGION --format='value(status.url)')

echo "Deployment complete!"
echo "Frontend: $FRONTEND_URL"
echo "Task Service: $TASK_URL"
echo "Notification Service: $NOTIF_URL"

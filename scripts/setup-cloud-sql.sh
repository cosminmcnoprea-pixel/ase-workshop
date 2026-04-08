#!/bin/bash

# Setup Cloud SQL for DevTask Hub
# This script creates the Cloud SQL instance and database

set -e

# Configuration
PROJECT_ID="aseworkshop"
INSTANCE_NAME="devtaskhub-db"
DATABASE_NAME="devtaskhub"
REGION="us-central1"
DB_USER="postgres"
DB_PASSWORD="postgres"

echo "Setting up Cloud SQL for DevTask Hub..."

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable sqladmin.googleapis.com
gcloud services enable sql-component.googleapis.com

# Create Cloud SQL instance
echo "Creating Cloud SQL instance..."
gcloud sql instances create $INSTANCE_NAME \
    --database-version=POSTGRES_15 \
    --tier=db-custom-4-16384 \
    --region=$REGION \
    --storage-size=20GB \
    --storage-type=SSD \
    --backup-start-time=02:00 \
    --authorized-networks=0.0.0.0/0

# Create database
echo "Creating database..."
gcloud sql databases create $DATABASE_NAME \
    --instance=$INSTANCE_NAME

# Create user
echo "Creating database user..."
gcloud sql users create $DB_USER \
    --instance=$INSTANCE_NAME \
    --password=$DB_PASSWORD

# Get instance connection name
echo "Getting instance connection name..."
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe $INSTANCE_NAME \
    --format='value(connectionName)')

echo "Cloud SQL setup complete!"
echo "Instance connection name: $INSTANCE_CONNECTION_NAME"
echo "Database URL: postgresql://$DB_USER:$DB_PASSWORD@10.0.0.5:5432/$DATABASE_NAME"

# Update environment variables in docker-compose.cloud.yml
echo "Updating docker-compose.cloud.yml..."
sed -i.bak "s/PROJECT_ID/$PROJECT_ID/g" docker-compose.cloud.yml

echo "Setup complete! You can now run: docker-compose -f docker-compose.cloud.yml up"

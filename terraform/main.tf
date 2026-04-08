terraform {
  required_version = ">= 1.5.0"

  backend "gcs" {
    bucket = "aseworkshop-terraform-state"
    prefix = "terraform/state"
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "sqladmin" {
  service            = "sqladmin.googleapis.com"
  disable_on_destroy = false
}

# Cloud SQL PostgreSQL instance
resource "google_sql_database_instance" "main" {
  name             = var.instance_name
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = var.db_tier
    disk_size         = var.disk_size
    disk_autoresize   = true
    availability_type = "ZONAL"

    ip_configuration {
      ipv4_enabled = true
    }

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
    }
  }

  deletion_protection = false

  depends_on = [google_project_service.sqladmin]
}

# Application database
resource "google_sql_database" "app_db" {
  name     = var.db_name
  instance = google_sql_database_instance.main.name
}

# Application user
resource "google_sql_user" "app_user" {
  name     = var.db_user
  instance = google_sql_database_instance.main.name
  password = var.db_password
}

output "instance_connection_name" {
  description = "Cloud SQL instance connection name (used by Cloud Run)"
  value       = google_sql_database_instance.main.connection_name
}

output "instance_ip" {
  description = "Cloud SQL instance public IP"
  value       = google_sql_database_instance.main.public_ip_address
}

output "database_name" {
  description = "Database name"
  value       = google_sql_database.app_db.name
}

output "database_user" {
  description = "Database user"
  value       = google_sql_user.app_user.name
}

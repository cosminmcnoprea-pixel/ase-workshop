variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "aseworkshop"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "europe-west3"
}

variable "instance_name" {
  description = "Cloud SQL instance name"
  type        = string
  default     = "ase-workshop-db"
}

variable "db_tier" {
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-f1-micro"
}

variable "disk_size" {
  description = "Disk size in GB"
  type        = number
  default     = 10
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "devtask_hub"
}

variable "db_user" {
  description = "Database user"
  type        = string
  default     = "app_user"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

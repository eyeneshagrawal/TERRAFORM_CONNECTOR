variable "account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "worker_name" {
  description = "Name of the Cloudflare Worker"
  type        = string
  default     = "student-task-manager"
}

variable "kv_namespace_name" {
  description = "Title of the Workers KV namespace"
  type        = string
  default     = "student_tasks"
}

variable "environment" {
  description = "Deployment environment (dev/test/production)"
  type        = string
  default     = "dev"
}

variable "app_title" {
  description = "Application title injected into the worker"
  type        = string
  default     = "Student Task Manager"
}

variable "workers_subdomain" {
  description = "Your workers.dev subdomain (used only for output URL)"
  type        = string
  default     = "YOUR-SUBDOMAIN"
}

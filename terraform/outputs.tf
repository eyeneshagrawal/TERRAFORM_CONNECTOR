output "worker_name" {
  value = cloudflare_workers_script.app.script_name
}

output "kv_namespace_id" {
  value = cloudflare_workers_kv_namespace.tasks.id
}

output "application_url" {
  value = "https://${cloudflare_workers_script.app.script_name}.${var.workers_subdomain}.workers.dev"
}

# 1) Workers KV namespace
resource "cloudflare_workers_kv_namespace" "tasks" {
  account_id = var.account_id
  title      = "${var.kv_namespace_name}_${var.environment}"
}

locals {
  # Inline frontend files into the worker so one apply deploys everything.
  worker_code = replace(
    replace(
      replace(
        file("${path.module}/../application/worker.js"),
        "__INDEX_HTML__", jsonencode(file("${path.module}/../application/index.html"))
      ),
      "__STYLE_CSS__", jsonencode(file("${path.module}/../application/style.css"))
    ),
    "__SCRIPT_JS__", jsonencode(file("${path.module}/../application/script.js"))
  )
}

# 2) Worker script + 3) Worker/KV binding
resource "cloudflare_workers_script" "app" {
  account_id         = var.account_id
  script_name        = "${var.worker_name}-${var.environment}"
  content            = local.worker_code
  main_module        = "worker.js"
  compatibility_date = "2025-01-01"

  bindings = [
    {
      name         = "TASKS_KV"
      type         = "kv_namespace"
      namespace_id = cloudflare_workers_kv_namespace.tasks.id
    },
    {
      name = "ENVIRONMENT"
      type = "plain_text"
      text = var.environment
    },
    {
      name = "APP_TITLE"
      type = "plain_text"
      text = var.app_title
    }
  ]
}

# Publish on workers.dev
resource "cloudflare_workers_script_subdomain" "app" {
  account_id  = var.account_id
  script_name = cloudflare_workers_script.app.script_name
  enabled     = true
}

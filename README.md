# Student Task Manager – Terraform IaC (Cloudflare Workers + KV)

Serverless task manager. Worker, KV namespace and binding are created ONLY by Terraform.

## One-time setup
1. Cloudflare: create API token (Edit Cloudflare Workers + Workers KV Storage, Account scope). Note Account ID and workers.dev subdomain (Workers & Pages → Overview).
2. `cd terraform && cp terraform.tfvars.example terraform.tfvars` and fill values (file is git-ignored).
3. Export token (never in code):
   - Linux/Mac: `export CLOUDFLARE_API_TOKEN=xxxx`
   - Windows PowerShell: `$env:CLOUDFLARE_API_TOKEN="xxxx"`

## Lifecycle commands (take a screenshot of each → /screenshots)
```
terraform --version      # SS: installation
git --version
terraform init           # SS
terraform fmt
terraform validate       # SS
terraform plan           # SS (highlight the 3 "+" resources)
terraform apply          # SS (+ Cloudflare dashboard: Worker, KV)
terraform output         # app URL
terraform show           # state
```
Test API:
```
URL=$(terraform output -raw application_url)
curl -X POST $URL/api/tasks -H "Content-Type: application/json" -d '{"title":"Submit Project Report","priority":"High","status":"Pending"}'
curl $URL/api/tasks
curl $URL/api/tasks/T101
curl -X PUT $URL/api/tasks/T101 -H "Content-Type: application/json" -d '{"status":"Completed"}'
curl -X DELETE $URL/api/tasks/T101
```
Modify experiment: change `environment` to `test` (or `worker_name`) in terraform.tfvars → `terraform plan` (shows ~/-/+) → `terraform apply`.
Destroy/recreate: `terraform plan -destroy` → `terraform destroy` (SS "Destroy complete!") → verify in dashboard → `terraform plan` → `terraform apply` (SS).

## Git + CI/CD
```
git init && git add . && git commit -m "Initial Terraform configuration"
git branch -M main
git remote add origin https://github.com/<you>/student-task-manager-iac.git
git push -u origin main
```
GitHub repo → Settings → Secrets and variables → Actions:
- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- Variable: `WORKERS_SUBDOMAIN`

**Remote state caveat:** CI runs on a fresh runner, so with local state it would try to re-create resources. Either run `terraform apply` locally only and use CI for fmt/validate/plan, or configure a remote backend (e.g. Terraform Cloud/R2). Document your choice in the report.

CI/CD demo: change `app_title` default (or the `<h1>`) to "Cloud-Based Student Task Manager", `git commit -am "Update application title" && git push` → SS of green Actions run.

## Report Q&A (Section 38)
1. **IaC**: managing infrastructure via machine-readable code files instead of manual console clicks.
2. **Problem solved**: irreproducible, error-prone, untracked, inconsistent manual setups.
3. **Declarative**: you describe the desired end state; Terraform works out the steps.
4. **Provider**: plugin that lets Terraform talk to an API (here Cloudflare).
5. **Resource**: a declared infrastructure object (Worker, KV namespace).
6. **Variable**: input parameter that avoids hard-coded values.
7. **Output**: values printed/exported after apply (worker name, KV ID, URL).
8. **State**: file mapping configuration to real resources and their attributes.
9. **init**: initialises working dir, downloads providers/modules, sets up backend.
10. **plan**: compares config, state and real infra; shows proposed + / ~ / - changes without applying.
11. **apply**: executes the plan, creates/updates resources, updates state.
12. **destroy**: deletes all resources managed by the configuration.
13. Manual edits cause **drift**/state mismatch; Terraform may revert or break them.
14. Tokens in code leak via Git, giving attackers account access; use env vars/GitHub Secrets.
15. **KV database**: globally distributed key-value store; values fetched by key (Workers KV).
16. Serverless: no servers to manage, free tier, auto-scaling, fast to deploy/destroy.
17. **CI/CD**: automated build/test/deploy on every change.
18. **GitHub Actions**: runs the workflow (init/validate/plan/apply) on each push using stored secrets.
19. Because the full desired state is in `.tf` files, `terraform apply` rebuilds everything.
20. **Drift**: real infrastructure differs from what Terraform code/state describes.

## Viva Q&A, extensions
Use Section 39 answers from the problem statement. Extensions already included: search, filter, completion statistics. Optional: dev/test/prod via `environment` variable (`terraform workspace` or separate tfvars).

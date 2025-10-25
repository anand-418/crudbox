# Crudbox Backend Service

This folder hosts the Golang API for Crudbox. It exposes authentication and management endpoints for organisations, projects, and mock endpoints, and serves the user-defined mock responses. The service is intended to be run from the monorepo root (`crudbox/backend`).

## Prerequisites

- Go 1.24+
- PostgreSQL 14+ (or compatible)

## Environment Variables

The API reads configuration from environment variables (or a `.env` file loaded via `godotenv`).

| Variable | Description |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSLMODE` | PostgreSQL connection details |
| `JWT_SECRET` | Secret used to sign JWT access tokens |

## Setup & Local Development

```bash
cd backend
go mod tidy

# Apply migrations (first run or after schema changes)
go run ./cmd/api -run-migrations

# Start the API server
go run ./cmd/api
```

The server listens on `http://localhost:8080`.

### Database Migrations

SQL migrations live in `internal/database/migrations` and are embedded into the binary. Running the server with the `-run-migrations` flag executes any pending migrations against the configured database. CI/CD workflows can reuse the same flag before deploying a new version of the service.

## AWS Lambda Deployment

Follow these steps to deploy the API to AWS Lambda behind an API Gateway:

1. **Populate GitHub secrets** used by the deployment workflow: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, optional `LAMBDA_STAGE` (defaults to `prod` if omitted), and all required application settings (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSLMODE`, `JWT_SECRET`).
2. **Trigger the deployment** by merging to `main` (or using the manual workflow dispatch). The workflow builds a Linux `bootstrap` binary, packages it, and calls `serverless deploy`, which provisions/updates both the Lambda function (runtime `provided.al2023`) and an HTTP API Gateway integration automatically.
3. **Review the deployment output** via the GitHub Actions logs or by running `npx serverless info --stage <stage>` locally to obtain the invoke URL. Adjust VPC networking on the generated Lambda if the database requires private connectivity.

Local development continues to work with `go run ./cmd/api`, while production traffic is managed by API Gateway → Lambda. No manual AWS resource creation is required.

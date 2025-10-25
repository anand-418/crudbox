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

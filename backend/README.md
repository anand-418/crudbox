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

Example `.env` for local development:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=crudbox_dev
DB_SSLMODE=disable
JWT_SECRET=replace-with-a-secure-random-string
```

## Setup & Local Development

```bash
cd backend
go mod download

# Apply migrations (first run or after schema changes)
go run ./cmd/api -run-migrations

# Start the API server
go run ./cmd/api
```

The server listens on `http://localhost:8080`.

### Database Migrations

SQL migrations live in `internal/database/migrations` and are embedded into the binary. Running the server with the `-run-migrations` flag executes any pending migrations against the configured database. CI/CD workflows can reuse the same flag before deploying a new version of the service.

### API Routes

Public routes:

- `GET /ping` — Health check
- `POST /signup` — Create a new user account
- `POST /login` — Exchange credentials for a JWT access token

Authenticated routes (require `Authorization: Bearer <token>`):

- `POST /organisation` — Create an organisation
- `GET /organisations` — List organisations for the authenticated user
- `POST /project` — Create a project under the active organisation
- `GET /projects` — List projects for the authenticated user
- `DELETE /project/:project_uuid` — Remove a project
- `POST /project/:project_uuid/endpoint` — Create a mock endpoint definition
- `PUT /project/:project_uuid/endpoint/:endpoint_uuid` — Update a mock endpoint
- `GET /project/:project_uuid/endpoints` — List endpoints for a project
- `DELETE /endpoint/:endpoint_uuid` — Delete an endpoint
- `GET /user` — Retrieve the authenticated user profile

Mock routes:

- `ANY /:code/*path` — Serve the stored mock response for a project code + path combination

## Repository Layout

- `cmd/api` — Application entrypoint and CLI flags
- `internal/database` — Connection helpers and embedded migration runner
- `internal/handler` — HTTP handlers and route wiring
- `internal/models` — Domain models and DTOs
- `internal/repository` — Database repositories
- `internal/service` — Business logic and orchestration
- `pkg/config` — Environment configuration loader
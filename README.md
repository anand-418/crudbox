# Crudbox

Crudbox is a monorepo for designing and serving mocked HTTP APIs. It combines a Golang backend (Gin + PostgreSQL) with a Next.js dashboard so that teams can create organisations, projects, and mocked endpoints from a single workspace. The repository unifies the backend and frontend codebases into `backend/` and `frontend/` directories with shared tooling at the root.

## Project Structure

```
backend/   # Go service with Gin, PostgreSQL, and embedded SQL migrations
frontend/  # Next.js application (App Router) for managing mock APIs
```

## Prerequisites

- Go 1.24+
- Node.js 18+ (with npm)
- PostgreSQL 14+ (local instance or remote connection string)

## Quick Start

1. **Ensure PostgreSQL is running** and that you have credentials for an accessible database.
2. **Set up and start the backend API.**
3. **Set up and start the frontend dashboard.**

### Backend Setup (Golang API)

```bash
cd backend
go mod tidy
```

Create a `.env` file (or export the variables) with the connection details and JWT secret:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=crudbox_db
DB_SSLMODE=disable
JWT_SECRET=replace-with-a-secure-random-string
```

Start the API server:

```bash
go run ./cmd/api
```

The backend listens on `http://localhost:8080`. Authenticated REST endpoints (e.g. `/signup`, `/project`, `/endpoint`) live at the root path, while mock endpoints are also served from the root using the project code (e.g. `/aB12C/users`).

### Frontend Setup (Next.js Dashboard)

```bash
cd frontend
npm install
```

Create `frontend/.env.local` with the backend base URL (adjust if the API runs elsewhere):

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to access the dashboard. Authentication flows store the JWT provided by the backend and reuse it for subsequent API calls.

## Backend Capabilities

- Email/password authentication with JWT sessions
- Organisation, project, and endpoint management
- Five-character project codes that map to public mock endpoints
- Raw SQL migrations managed via `sqlx` and embedded migration files

## Frontend Capabilities

- Dark monochrome dashboard with glassmorphism-inspired panels
- Signup and login flows backed by the backend API
- Organisation, project, and endpoint management views with inline editing
- Toggleable enable/disable switches for endpoints and copy-to-clipboard helpers

## Mock Endpoints

After creating a project and defining endpoints in the dashboard, the backend immediately serves the configured responses. For example, if a project has the code `aB12C` and you register a `GET /users` endpoint, requests to `http://localhost:8080/aB12C/users` respond with the stored payload, status code, and headers.

## Tooling

- **Backend:** Go 1.24, Gin, sqlx, PostgreSQL, JWT, bcrypt
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS

Extend the platform by adding features such as shared projects, request logging, or versioned endpoint definitions.

# Tasks API — Express.js + TypeScript + Knex

A production-ready RESTful API for managing tasks, built with **Express.js**, **TypeScript**, **Knex.js** (migrations), **Joi** (validation), **JWT** (authentication), and **Swagger** (docs).

---

## Tech Stack

| Layer          | Technology                           |
|----------------|--------------------------------------|
| Runtime        | Node.js + TypeScript                 |
| Framework      | Express.js                           |
| Database       | PostgreSQL                           |
| Query Builder  | Knex.js (with migrations & seeds)    |
| Validation     | Joi                                  |
| Authentication | JWT (jsonwebtoken + bcryptjs)        |
| API Docs       | Swagger UI (swagger-jsdoc)           |
| Testing        | Jest + ts-jest (29 tests)            |

---

## Project Structure

```
tasks-api/
├── src/
│   ├── app.ts                         # Express app, middleware, routes
│   ├── server.ts                      # Entry point, DB connection, graceful shutdown
│   ├── config/
│   │   ├── database.ts                # Knex instance (dev/test/prod)
│   │   └── swagger.ts                 # OpenAPI 3.0 spec configuration
│   ├── controllers/
│   │   ├── task.controller.ts         # CRUD request handlers
│   │   └── auth.controller.ts         # Login handler
│   ├── middleware/
│   │   ├── auth.middleware.ts         # JWT Bearer token guard
│   │   ├── error.middleware.ts        # Global error + 404 handlers
│   │   └── validate.middleware.ts     # Joi validation factory
│   ├── migrations/
│   │   ├── 20240101_001_create_users_table.ts
│   │   └── 20240101_002_create_tasks_table.ts
│   ├── routes/
│   │   ├── task.routes.ts             # /api/tasks (Swagger annotated)
│   │   └── auth.routes.ts             # /api/auth (Swagger annotated)
│   ├── seeds/
│   │   └── 001_users.ts               # Demo users seed
│   ├── services/
│   │   ├── task.service.ts            # Task business logic
│   │   └── auth.service.ts            # Auth + JWT business logic
│   ├── tests/
│   │   ├── task.service.test.ts       # 10 tests
│   │   ├── auth.service.test.ts       # 5 tests
│   │   ├── auth.middleware.test.ts    # 5 tests
│   │   └── validate.middleware.test.ts# 9 tests
│   ├── types/
│   │   └── index.ts                   # Shared TS interfaces & types
│   └── validators/
│       ├── task.validator.ts          # Joi schemas for task endpoints
│       └── auth.validator.ts          # Joi schemas for auth endpoint
├── knexfile.ts                        # Knex config (dev/test/prod)
├── tsconfig.json
├── jest.config.js
└── .env.example
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=tasks_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
```

### 3. Create the database

```sql
CREATE DATABASE tasks_db;
```

### 4. Run migrations

```bash
npm run migrate
```

### 5. Seed demo users

```bash
npm run seed
```

| Email              | Password    |
|--------------------|-------------|
| admin@example.com  | password123 |
| user@example.com   | password123 |

### 6. Start the server

```bash
npm run dev        # Development (hot reload)
npm run build && npm start  # Production
```

---

## API Endpoints

**Base URL:** `http://localhost:3000/api`

### Auth

| Method | Endpoint     | Auth Required | Description           |
|--------|-------------|---------------|-----------------------|
| POST   | /auth/login  | No            | Login, receive JWT    |

### Tasks

| Method | Endpoint    | Auth Required | Description                    |
|--------|------------|---------------|--------------------------------|
| GET    | /tasks      | Yes           | Get all tasks (paginated)      |
| GET    | /tasks/:id  | Yes           | Get task by ID                 |
| POST   | /tasks      | Yes           | Create a new task              |
| PATCH  | /tasks/:id  | Yes           | Partially update a task        |
| DELETE | /tasks/:id  | Yes           | Soft-delete a task             |

**Pagination:** `GET /api/tasks?page=1&limit=10`

**Other:** `GET /health`, `GET /api/docs` (Swagger UI), `GET /api/docs.json`

---

## Example Requests

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'
```

### Create Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title": "Build the API", "status": "in_progress"}'
```

### Get All Tasks (paginated)
```bash
curl "http://localhost:3000/api/tasks?page=1&limit=5" \
  -H "Authorization: Bearer <token>"
```

---

## Database Schema

### users
| Column     | Type         | Notes          |
|-----------|-------------|----------------|
| id         | SERIAL PK    |                |
| email      | VARCHAR(255) | UNIQUE         |
| password   | VARCHAR(255) | bcrypt hashed  |
| name       | VARCHAR(100) |                |
| created_at | TIMESTAMP    | auto           |
| updated_at | TIMESTAMP    | auto           |

### tasks
| Column       | Type                                   | Notes                    |
|-------------|---------------------------------------|--------------------------|
| id           | SERIAL PK                              |                          |
| title        | VARCHAR(255)                           | NOT NULL                 |
| description  | TEXT                                   | nullable                 |
| status       | ENUM(pending,in_progress,completed)   | default: pending         |
| completed_at | TIMESTAMP                              | auto-set on completion   |
| deleted_at   | TIMESTAMP                              | soft delete              |
| created_at   | TIMESTAMP                              | auto                     |
| updated_at   | TIMESTAMP                              | auto                     |

---

## Key Design Decisions

- **Soft Delete** — `deleted_at` is set instead of removing the row; all queries filter `WHERE deleted_at IS NULL`.
- **Auto `completed_at`** — Automatically set when status → `completed`; cleared when status moves away.
- **Joi validation** — Applied via middleware factory before every controller; returns `422` with field-level errors.
- **JWT guard** — Applied at router level to all `/api/tasks` routes. Handles expired vs invalid tokens distinctly.
- **Global error handler** — Catches all unhandled errors; sanitizes 500 messages in production.

---

## Knex Commands

```bash
npm run migrate           # Run pending migrations
npm run migrate:rollback  # Rollback last batch
npm run seed              # Run seed files
```

---

## Testing

```bash
npm test               # Run all 29 tests
npm run test:coverage  # With coverage report
```

**Test suites:**
- `TaskService` — findAll, findById, create, update (completed_at logic), softDelete
- `AuthService` — findByEmail, login (success + failure cases), hashPassword
- `authenticate` middleware — missing / wrong scheme / expired / invalid / valid tokens
- `validate` middleware — valid payloads, missing required fields, invalid enums, invalid email/password

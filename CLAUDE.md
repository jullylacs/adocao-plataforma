# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HappyPet** is a full-stack animal adoption platform connecting animals with adopters. It is a monorepo with a NestJS backend and a Next.js frontend.

## Development Commands

### Backend (run from `backend/`)
```bash
npm run start:dev   # Dev server with watch mode (port 3003)
npm run build       # Compile TypeScript
npm run start:prod  # Run compiled build
```

### Frontend (run from `frontend/`)
```bash
npm run dev         # Dev server (port 3001)
npm run build       # Production build
npm run start       # Run production build
```

### Database
The backend uses MySQL. Default local config (overridden by `.env`):
- Host: `localhost`, Port: `3306`, User: `root`, Password: `12345`, DB: `happypet`
- `synchronize: true` is enabled — schema auto-syncs from TypeORM entities in dev.

## Architecture

### Backend (`backend/src/`)
NestJS with TypeORM (MySQL). Modules follow the standard NestJS pattern (module / controller / service / entity / dto).

Key modules:
- `auth/` — JWT + Passport authentication; issues tokens on login; `GET /auth/me` returns current user
- `animals/` — public read endpoints (`GET /animals`, `GET /animals/:id`) and admin CRUD under `/admin/animals`
- `users/` — user management
- `reservations/` — reservation workflow: `pending → approved/rejected → completed`
- `appointments/` — scheduling visits/pickups: `pending → confirmed → completed/cancelled/rejected`
- `common/` — `JwtAuthGuard`, `RolesGuard`, and shared decorators protecting admin routes

CORS is configured to allow `localhost:3001`.

### Frontend (`frontend/app/`)
Next.js 14 App Router. Auth tokens and role are stored in `localStorage`. Axios is used for API calls.

Route layout by role:
- `/auth/` — login and register (public)
- `/animals` — public animal listing
- `/adotante/` — adopter-facing pages (animal list, detail, dashboard)
- `/admin/` — admin dashboard, animal CRUD, adopter management
- `/dashboard/` — shared appointments and reservations pages

Styling uses Tailwind CSS and Bootstrap 5.

### Data Model
- **User**: roles `admin` | `adotante`
- **Animal**: status `available` | `reserved` | `adopted`; `photoUrls` stored as JSON array
- **Reservation**: links User ↔ Animal with approval workflow
- **Appointment**: type `adoption_visit` | `adoption_pickup`; links User ↔ Animal with scheduling workflow

# TRAININGPLANNER

## Overview

TrainingPlanner is a strength and conditioning platform for coaches and athletes. It allows coaches to create exercise libraries, build workout templates, assign workouts to athletes on specific dates, and track performance over time. Athletes can view their assigned training sessions, log their results, and monitor progress through analytics charts.

The app follows a full-stack TypeScript monorepo pattern with a React frontend, Express backend, and PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project is organized into three main directories:
- **`client/`** — React single-page application (frontend)
- **`server/`** — Express.js API server (backend)
- **`shared/`** — Shared types, schemas, and route contracts used by both client and server

### Frontend (`client/`)
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (dark athletic theme by default)
- **Forms**: React Hook Form with Zod resolvers for validation
- **Charts**: Recharts for performance analytics
- **Date Utilities**: date-fns
- **Build Tool**: Vite

Path aliases are configured:
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

Pages include: Dashboard, Exercises Library, Workouts (templates), Workout Detail, Training (assigned sessions), Session (active workout logging), Performance (analytics charts), Auth, Coach Athletes (manage connections), and Messages (in-app messaging).

All pages except Auth are protected routes that require authentication.

### Backend (`server/`)
- **Framework**: Express.js running on Node with `tsx`
- **Authentication**: Replit OpenID Connect (OIDC) integration via Passport.js with session-based auth stored in PostgreSQL
- **Session Store**: `connect-pg-simple` backed by the `sessions` table
- **API Pattern**: RESTful JSON API under `/api/*` prefix
- **Route Contract**: A shared `shared/routes.ts` file defines the API contract with Zod schemas for input validation and response typing, used by both client and server

Key API endpoints:
- `GET/POST /api/coach/athletes`, `POST /api/coach/athletes/connect`, `DELETE /api/coach/athletes/:athleteId` — Coach-athlete connections
- `GET /api/athlete/coaches` — Athlete's connected coaches
- `GET/POST /api/messages/conversations`, `GET/POST /api/messages/conversations/:id/messages` — Messaging system
- `GET/POST /api/exercises` — Exercise library CRUD
- `GET/POST /api/workouts` — Workout template CRUD
- `GET /api/workouts/:id` — Workout detail with exercises
- `POST /api/workouts/:id/exercises` — Add exercise to workout
- `GET/POST /api/assignments` — Assign workouts to users
- `PATCH /api/assignments/:id/complete` — Mark assignment complete
- `POST /api/performance` — Log performance data
- `GET /api/performance/:exerciseId` — Get performance history

### Database
- **Database**: PostgreSQL (required, provisioned via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-Zod validation
- **Schema Location**: `shared/schema.ts` and `shared/models/auth.ts`
- **Migrations**: Managed via `drizzle-kit push` (no migration files, direct schema push)

Database tables:
- `users` — User profiles (managed by Replit Auth)
- `sessions` — Session storage for auth (managed by Replit Auth)
- `exercises` — Exercise library (name, category, instructions, video URL)
- `workouts` — Workout templates (name, description, coach ID)
- `workout_exercises` — Junction table linking exercises to workouts with sets/reps/order
- `assignments` — Assigns a workout to a user on a specific date, tracks completion
- `performance_logs` — Actual performance data logged by athletes (exercise, weight, reps, date)
- `coach_athletes` — Join table for coach-athlete relationships (coachId + athleteId, unique constraint)
- `conversations` — Chat conversations (isGroup, title, lastMessageAt)
- `conversation_participants` — Maps users to conversations (unique per user per conversation)
- `messages` — Individual messages in conversations (senderId, content, createdAt)

### Build Process
- **Development**: `tsx server/index.ts` runs the Express server with Vite middleware for HMR
- **Production Build**: Custom `script/build.ts` runs Vite for client build and esbuild for server bundling
- **Output**: `dist/public/` for client assets, `dist/index.cjs` for server bundle

### Authentication
- Uses **Replit Auth** (OpenID Connect) — not username/password
- Auth flow: `/api/login` redirects to Replit OIDC, callback upserts user into database
- Sessions stored in PostgreSQL via `connect-pg-simple`
- Protected routes on client side check `/api/auth/user` endpoint
- `SESSION_SECRET` environment variable is required

### Storage Layer
- `server/storage.ts` implements `IStorage` interface with `DatabaseStorage` class
- All database operations go through this storage layer, making it easy to swap implementations

### Bluetooth Heart Rate Monitoring
- **Client-only feature** using Web Bluetooth API (requires Chrome on Android/macOS/Windows with HTTPS)
- `client/src/hooks/use-bluetooth.ts` — `useBluetoothHeartRate()` hook for BLE Heart Rate Service connection
- `client/src/components/BluetoothPanel.tsx` — UI components: `BluetoothConnectButton`, `BluetoothLiveCard`, `BluetoothErrorBanner`
- Integrated into `AthleteWorkoutSessionPage` — athletes can connect a BLE heart rate monitor during workouts
- Tracks live HR, session avg/max/min, color-coded HR zones (Rest, Warm Up, Fat Burn, Cardio, Peak, Max)
- Proper cleanup: removes event listeners and disconnects GATT on unmount/disconnect, avoids duplicate listeners
- Shows "connected but waiting for data" state when device connected but no readings yet

### Exercise Seed Data
- `server/exercise-data.ts` contains a large library of pre-built exercises organized by muscle group and equipment type

## External Dependencies

### Required Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (must be provisioned)
- `SESSION_SECRET` — Secret for session encryption
- `ISSUER_URL` — OpenID Connect issuer (defaults to `https://replit.com/oidc`)
- `REPL_ID` — Replit environment identifier (auto-set in Replit)

### Third-Party Services
- **Replit Auth (OIDC)** — Authentication provider
- **PostgreSQL** — Primary database (provisioned via Replit)

### Key NPM Dependencies
- `drizzle-orm` + `drizzle-kit` — Database ORM and migration tooling
- `express` + `express-session` — HTTP server and session management
- `passport` + `openid-client` — Authentication
- `zod` + `drizzle-zod` — Schema validation
- `@tanstack/react-query` — Client-side data fetching
- `recharts` — Performance charts
- `wouter` — Client-side routing
- `react-hook-form` + `@hookform/resolvers` — Form management
- `shadcn/ui` components (Radix UI primitives) — UI component library
- `date-fns` — Date formatting and manipulation
- `tailwindcss` — Utility-first CSS framework
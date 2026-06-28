# Epicly — Gamified Life Operating System

Level up your actual life. Complete real-world tasks, habits, and goals to earn XP, maintain streaks, and compete on leaderboards.

## Monorepo Structure

```
lifequest/
├── apps/
│   ├── mobile/     # React Native (Expo) app
│   └── api/        # Express.js backend
├── packages/
│   └── shared/     # Shared types & XP constants
```

## Prerequisites

- Node.js 18+
- npm 9+
- Expo Go app (for mobile testing)
- Supabase account (database + auth)
- Upstash Redis account (leaderboard)
- Anthropic API key (AI coach)

## Quick Start

### 1. Install dependencies

```bash
npm install
npm run build:shared
```

### 2. Configure environment

Copy `.env.example` to `.env` at the repo root and fill in credentials:

| Variable | When needed |
|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Step 2 — Database & Auth |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Step 6 — Leaderboard |
| `ANTHROPIC_API_KEY` | Step 11 — AI Coach |
| `JWT_SECRET` | Set to your Supabase JWT Secret (Settings → API) |

For mobile, also set in `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open SQL Editor and run `apps/api/src/db/schema.sql`
3. Copy Project URL, anon key, service role key, and JWT secret into `.env`

### 4. Run the API

```bash
npm run dev:api
```

API runs at `http://localhost:3000`. Health check: `GET /health`

### 5. Run the mobile app

```bash
npm run dev:mobile
```

Scan the QR code with Expo Go.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/tasks?filter=today` | List tasks |
| POST | `/api/tasks/:id/complete` | Complete task + XP |
| GET | `/api/habits` | List habits |
| POST | `/api/habits/:id/complete` | Complete habit + XP |
| GET | `/api/xp/stats` | Level & progress |
| GET | `/api/leaderboard/global` | Top players |
| POST | `/api/coach/message` | AI coach (SSE stream) |
| GET | `/api/users/me` | Profile & badges |

## XP System

- **Tasks**: 25–200 XP by difficulty (easy → epic)
- **Habits**: 30 XP daily, 80 XP weekly
- **Streak bonuses**: 3d (+50), 7d (+150), 14d (+300), 30d (+750), 100d (+2000)
- **Levels**: exponential curve — `100 × level^1.8` total XP required

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo) + TypeScript |
| State | Zustand |
| Navigation | Expo Router |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL (Supabase) |
| Cache / Leaderboard | Redis (Upstash) |
| AI Coach | LangGraph + Claude |
| Auth | Supabase Auth (JWT) |

## Build Order (completed scaffold)

1. Monorepo + shared package
2. Database schema + clients
3. Auth routes + JWT middleware
4. XP & streak services
5. Task & habit routes
6. Redis leaderboard service
7. Mobile auth screens
8. Mobile home screen
9. Quest creation form
10. Leaderboard screen
11. AI coach (LangGraph + SSE + chat UI)
12. Push notification service stub
13. XP animations + level-up modal

## Next Steps

When you're ready, provide credentials for:

1. **Supabase** — URL, anon key, service role key, JWT secret
2. **Upstash Redis** — REST URL and token
3. **Anthropic** — API key for the AI coach

# SSAPOST

Self-hosted internal API testing workspace for small teams.

## What is in place

- Next.js app scaffold
- PostgreSQL + Prisma schema
- Invite-code registration
- Session-based login/logout
- Initial project creation API
- Dashboard shell for shared workspace data

## Setup

1. Copy `.env.example` to `.env` and fill in values.
2. Run `pnpm install`.
3. Run `pnpm prisma:generate`.
4. Run `pnpm prisma:migrate`.
5. Run `pnpm prisma:seed` to create the organization and invite code.
6. Start the app with `pnpm dev`.

## Docker

1. Copy `.env.example` to `.env` and set `APP_ENCRYPTION_KEY` to a random secret.
2. Run `docker compose up --build`.
3. Open `http://localhost:3000`.

**Note:** The `.env` file works for both local development and Docker Compose. The `DATABASE_URL` is auto-overridden by Compose services to point at the `db` service hostname inside the container network.

## Notes

- Secrets are encrypted at rest in the data model design.
- Single-request execution, validation, folder management, and run history are planned next.
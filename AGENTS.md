# Repository Guidelines

## Project Structure & Module Organization

This repository contains two independent pnpm projects. `client/` holds the React 19, TypeScript, and Vite frontend (`src/`), static assets (`public/`), and Cloudflare deployment configuration. `server/` contains the Express 5 API (`src/`), Prisma schema and migrations (`prisma/`), and Bruno API request collection (`bruno/`). Build output is generated in each package’s `dist/` directory; do not edit generated files directly.

## Build, Test, and Development Commands

Run commands from the relevant package directory:

- `cd client && pnpm dev` starts the Vite development server.
- `cd client && pnpm build` type-checks and builds the frontend; `pnpm lint` runs Oxlint.
- `cd server && pnpm dev` starts the API with watch mode; `pnpm build && pnpm start` builds and runs it.
- `cd server && pnpm db:generate` generates the Prisma client; `pnpm db:migrate` applies development migrations.
- `cd server && pnpm lint` runs Oxlint; `pnpm fmt:check` checks Oxfmt formatting (`pnpm fmt` applies it).

No automated unit-test script is currently configured. Use the Bruno collection in `server/bruno/` for API request checks, against a configured development API.

## Coding Style & Naming Conventions

Use TypeScript and the existing module boundaries. Follow the package’s lint and formatting configuration rather than introducing a new style. Use PascalCase for React components and types, camelCase for variables and functions, and descriptive lowercase filenames consistent with nearby modules. Keep API validation and database changes aligned with the existing Zod and Prisma patterns.

## Testing Guidelines

Run the relevant package build and lint commands after changes. For API behavior, exercise the matching Bruno requests and include coverage for authentication/session requirements when relevant. For schema changes, generate the Prisma client and create a migration; avoid editing generated client output.

## Commit & Pull Request Guidelines

Recent history follows Conventional Commit-style subjects, such as `feat(server): ...`, `fix(validation): ...`, and `chore(prisma): ...`. Use a short imperative summary and an optional scope. Pull requests should explain the behavior or schema change, list validation commands and results, link related work when available, and include screenshots for visible frontend changes.

## Security & Configuration

Keep credentials and local settings in `server/.env`; use `.env.example` as the template. Never commit secrets or expose `DATABASE_URL` to the client. Configure `SESSION_SECRET` and `CLIENT_ORIGIN` for the target environment, and apply Prisma migrations before deploying schema changes.

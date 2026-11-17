# Messaging App API

API en Express 5 y TypeScript. Usa PostgreSQL en Neon, Prisma para los datos y sesiones persistidas en PostgreSQL.

## Desarrollo local

1. Copia `.env.example` como `.env` y completa `DATABASE_URL` de Neon y un `SESSION_SECRET` aleatorio de al menos 32 caracteres.
2. Instala dependencias con `pnpm install`.
3. Ejecuta `pnpm db:migrate` para crear la migración inicial y aplicarla a la base de desarrollo.
4. Ejecuta `pnpm dev` para iniciar la API en `http://localhost:4000`.

## Rutas actuales

- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET /api/auth/me`, `PATCH /api/auth/me`
- `GET /api/users?search=...`
- `GET /api/conversations`, `POST /api/conversations`
- `GET /api/conversations/:conversationId/messages`
- `POST /api/conversations/:conversationId/messages`

Las rutas de perfil, usuarios y conversaciones requieren una sesión. El servidor limita los mensajes a 4000 caracteres y devuelve hasta 100 mensajes al consultar una conversación.

## Despliegue en Render

- Root directory: `server`
- Build command: `pnpm install --frozen-lockfile && pnpm db:generate && pnpm build`
- Ejecuta `pnpm db:deploy` antes del primer despliegue y después de cada cambio de esquema. Si el plan de Render ofrece un comando pre-deploy, configúralo allí.
- Start command: `pnpm start`
- Variables: `DATABASE_URL`, `SESSION_SECRET`, `CLIENT_ORIGIN` (origen exacto del cliente), `NODE_ENV=production`; Render proporciona `PORT`.

El frontend y la API deben publicarse bajo subdominios del mismo dominio raíz (por ejemplo, `app.ejemplo.com` y `api.ejemplo.com`) para que el navegador trate la cookie como same-site. `CLIENT_ORIGIN` debe coincidir exactamente con el origen del frontend. No se debe compartir `DATABASE_URL` con el cliente.

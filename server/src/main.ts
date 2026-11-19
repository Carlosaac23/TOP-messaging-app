import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import session from 'express-session';
import { Pool } from 'pg';

import { env } from './config.js';
import { prisma } from './db.js';
import { authRouter } from './routes/auth.js';
import { conversationsRouter } from './routes/conversations.js';
import { usersRouter } from './routes/users.js';

const app = express();
const PgSession = connectPgSimple(session);
const sessionPool = new Pool({ connectionString: env.DATABASE_URL });

if (env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '16kb' }));
app.use(
  session({
    name: 'messaging.sid',
    store: new PgSession({ pool: sessionPool, createTableIfMissing: true }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/conversations', conversationsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Ocurrió un error interno.' });
};
app.use(errorHandler);

const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`API escuchando en el puerto ${env.PORT}`);
});

const shutdown = () => {
  server.close(() => {
    void Promise.all([prisma.$disconnect(), sessionPool.end()]).finally(() => process.exit(0));
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

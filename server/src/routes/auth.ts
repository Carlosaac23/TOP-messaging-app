import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';

import { prisma } from '../db.js';
import { authenticate } from '../middleware/authenticate.js';

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform(value => value.toLowerCase()),
  password: z.string().min(8).max(72),
});

const registrationSchema = credentialsSchema.extend({
  username: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/)
    .transform(value => value.toLowerCase()),
  displayName: z.string().trim().min(1).max(50).optional(),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

authRouter.post('/register', loginLimiter, async (req, res) => {
  const parsed = registrationSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: 'Invalid registration data.', details: parsed.error.flatten().fieldErrors });
    return;
  }

  const { email, username, password, displayName } = parsed.data;
  const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existingUser) {
    res.status(409).json({ error: 'Email or username is already registered.' });
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      username,
      displayName: displayName ?? username,
      passwordHash: await bcrypt.hash(password, 12),
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      bio: true,
      createdAt: true,
    },
  });

  req.session.regenerate(error => {
    if (error) return res.status(500).json({ error: 'Could not start the session.' });
    req.session.userId = user.id;
    req.session.save(saveError => {
      if (saveError) return res.status(500).json({ error: 'Could not save the session.' });
      res.status(201).json({ user });
    });
  });
});

authRouter.post('/login', loginLimiter, async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid email or password.' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: 'Incorrect email or password.' });
    return;
  }

  req.session.regenerate(error => {
    if (error) return res.status(500).json({ error: 'Could not start the session.' });
    req.session.userId = user.id;
    req.session.save(saveError => {
      if (saveError) return res.status(500).json({ error: 'Could not save the session.' });
      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          bio: user.bio,
          createdAt: user.createdAt,
        },
      });
    });
  });
});

authRouter.post('/logout', authenticate, (req, res, next) => {
  req.session.destroy(error => {
    if (error) return next(error);
    res.clearCookie('messaging.sid');
    res.status(204).end();
  });
});

authRouter.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) {
    res.status(401).json({ error: 'The session is no longer associated with a valid user.' });
    return;
  }

  res.json({ user });
});

authRouter.patch('/me', authenticate, async (req, res) => {
  const parsed = z
    .object({
      displayName: z.string().trim().min(1).max(50).optional(),
      bio: z.string().trim().max(280).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    res.status(400).json({ error: 'Provide a valid name or bio.' });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.session.userId },
    data: parsed.data,
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      bio: true,
      createdAt: true,
    },
  });

  res.json({ user });
});

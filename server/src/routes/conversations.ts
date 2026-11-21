import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../db.js';
import { authenticate } from '../middleware/authenticate.js';

export const conversationsRouter = Router();
conversationsRouter.use(authenticate);

conversationsRouter.get('/', async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: req.session.userId } } },
    include: {
      participants: {
        where: { userId: { not: req.session.userId } },
        select: { user: { select: { id: true, username: true, displayName: true, bio: true } } },
      },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ conversations });
});

conversationsRouter.post('/', async (req, res) => {
  const parsed = z.object({ userId: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success || parsed.data.userId === req.session.userId) {
    res.status(400).json({ error: 'Select another user to start a conversation.' });
    return;
  }

  const otherUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true },
  });
  if (!otherUser) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const existing = await prisma.conversation.findMany({
    where: { participants: { some: { userId: req.session.userId } } },
    include: { participants: { select: { userId: true } } },
  });
  const conversation = existing.find(item => {
    const ids = item.participants.map(({ userId }) => userId);
    return ids.length === 2 && ids.includes(req.session.userId!) && ids.includes(otherUser.id);
  });
  if (conversation) {
    res.json({ conversation });
    return;
  }

  const created = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: req.session.userId! }, { userId: otherUser.id }],
      },
    },
    include: {
      participants: {
        select: { user: { select: { id: true, username: true, displayName: true, bio: true } } },
      },
    },
  });
  res.status(201).json({ conversation: created });
});

conversationsRouter.get('/:conversationId/messages', async (req, res) => {
  const conversationId = z.string().min(1).safeParse(req.params.conversationId);
  if (!conversationId.success) {
    res.status(400).json({ error: 'Invalid conversation ID.' });
    return;
  }

  const membership = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId: conversationId.data, userId: req.session.userId! },
    },
  });
  if (!membership) {
    res.status(404).json({ error: 'Conversation not found.' });
    return;
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: conversationId.data },
    include: { sender: { select: { id: true, username: true, displayName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  messages.reverse();
  res.json({ messages });
});

conversationsRouter.post('/:conversationId/messages', async (req, res) => {
  const parsed = z.object({ body: z.string().trim().min(1).max(4000) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Message must be between 1 and 4000 characters.' });
    return;
  }

  const membership = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId: req.params.conversationId,
        userId: req.session.userId!,
      },
    },
  });
  if (!membership) {
    res.status(404).json({ error: 'Conversation not found.' });
    return;
  }

  const message = await prisma.$transaction(async tx => {
    const created = await tx.message.create({
      data: {
        body: parsed.data.body,
        conversationId: req.params.conversationId,
        senderId: req.session.userId!,
      },
      include: { sender: { select: { id: true, username: true, displayName: true } } },
    });
    await tx.conversation.update({
      where: { id: req.params.conversationId },
      data: { updatedAt: new Date() },
    });
    return created;
  });
  res.status(201).json({ message });
});

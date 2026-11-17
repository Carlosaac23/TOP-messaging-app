import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate } from "../middleware/authenticate.js";

export const usersRouter = Router();
usersRouter.use(authenticate);

usersRouter.get("/", async (req, res) => {
  const parsed = z.string().trim().max(50).optional().safeParse(req.query.search);
  if (!parsed.success) {
    res.status(400).json({ error: "La búsqueda no puede superar 50 caracteres." });
    return;
  }
  const search = parsed.data;
  const users = await prisma.user.findMany({
    where: {
      id: { not: req.session.userId },
      ...(search
        ? {
            OR: [
              { username: { contains: search, mode: "insensitive" } },
              { displayName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: { id: true, username: true, displayName: true, bio: true },
    orderBy: { username: "asc" },
    take: 50,
  });

  res.json({ users });
});

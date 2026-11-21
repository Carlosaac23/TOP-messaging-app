import type { RequestHandler } from 'express';

export const authenticate: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'You must log in to continue.' });
    return;
  }

  next();
};

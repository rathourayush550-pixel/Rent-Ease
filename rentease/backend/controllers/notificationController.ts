import { Response } from 'express';
import { getDatabase, saveDatabase } from '../database/db.ts';
import { AuthRequest } from '../middleware/auth.ts';

export const getNotifications = (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const list = db.notifications
    .filter((n) => n.user_id === req.user!.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const unreadCount = list.filter((n) => !n.is_read).length;

  res.json({
    success: true,
    notifications: list,
    unreadCount,
  });
};

export const markNotificationRead = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const db = getDatabase();

  if (id === 'all') {
    db.notifications
      .filter((n) => n.user_id === req.user!.id)
      .forEach((n) => {
        n.is_read = true;
      });
  } else {
    const item = db.notifications.find((n) => n.id === Number(id) && n.user_id === req.user!.id);
    if (item) item.is_read = true;
  }

  saveDatabase();

  res.json({
    success: true,
    message: 'Notifications marked as read.',
  });
};

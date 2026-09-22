import { Response } from 'express';
import { getDatabase, saveDatabase } from '../database/db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { Message } from '../models/types.ts';

export const getConversations = (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;

  const userMessages = db.messages.filter(
    (m) => m.sender_id === userId || m.receiver_id === userId
  );

  const contactMap = new Map<number, { contact: any; lastMessage: Message; unreadCount: number }>();

  userMessages.forEach((msg) => {
    const contactId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    const existing = contactMap.get(contactId);

    if (!existing || new Date(msg.created_at) > new Date(existing.lastMessage.created_at)) {
      const contactUser = db.users.find((u) => u.id === contactId);
      const { password: _, ...cleanContact } = contactUser || {};

      const unreadCount = db.messages.filter(
        (m) => m.sender_id === contactId && m.receiver_id === userId && !m.is_read
      ).length;

      contactMap.set(contactId, {
        contact: cleanContact,
        lastMessage: msg,
        unreadCount,
      });
    }
  });

  const conversations = Array.from(contactMap.values()).sort(
    (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
  );

  res.json({
    success: true,
    conversations,
  });
};

export const getMessagesWithUser = (req: AuthRequest, res: Response): void => {
  const { otherUserId } = req.params;
  const db = getDatabase();
  const userId = req.user!.id;
  const targetId = Number(otherUserId);

  const thread = db.messages
    .filter(
      (m) =>
        (m.sender_id === userId && m.receiver_id === targetId) ||
        (m.sender_id === targetId && m.receiver_id === userId)
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Mark messages from target to current user as read
  let updated = false;
  thread.forEach((m) => {
    if (m.sender_id === targetId && m.receiver_id === userId && !m.is_read) {
      m.is_read = true;
      updated = true;
    }
  });

  if (updated) {
    saveDatabase();
  }

  const otherUser = db.users.find((u) => u.id === targetId);
  const { password: _, ...cleanOther } = otherUser || {};

  res.json({
    success: true,
    otherUser: cleanOther,
    messages: thread,
  });
};

export const sendMessage = (req: AuthRequest, res: Response): void => {
  try {
    const { receiver_id, property_id, message } = req.body;

    if (!receiver_id || !message || !message.trim()) {
      res.status(400).json({ success: false, message: 'Receiver ID and message content are required.' });
      return;
    }

    const db = getDatabase();
    const recipient = db.users.find((u) => u.id === Number(receiver_id));

    if (!recipient) {
      res.status(404).json({ success: false, message: 'Recipient not found.' });
      return;
    }

    const nextId = db.messages.length > 0 ? Math.max(...db.messages.map((m) => m.id)) + 1 : 1;
    const newMsg: Message = {
      id: nextId,
      sender_id: req.user!.id,
      receiver_id: recipient.id,
      property_id: property_id ? Number(property_id) : undefined,
      message: message.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    };

    db.messages.push(newMsg);

    // Notify recipient
    const nextNotifId = db.notifications.length > 0 ? Math.max(...db.notifications.map((n) => n.id)) + 1 : 1;
    db.notifications.push({
      id: nextNotifId,
      user_id: recipient.id,
      title: `New message from ${req.user!.name}`,
      message: newMsg.message.length > 60 ? `${newMsg.message.substring(0, 60)}...` : newMsg.message,
      type: 'system',
      link: req.user!.role === 'owner' ? '/tenant/messages' : '/owner/messages',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    saveDatabase();

    res.status(201).json({
      success: true,
      message: 'Message sent.',
      data: newMsg,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};

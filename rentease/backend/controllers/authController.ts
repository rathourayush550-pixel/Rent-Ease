import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase, saveDatabase } from '../database/db.ts';
import { generateToken, AuthRequest } from '../middleware/auth.ts';
import { UserRole } from '../models/types.ts';

export const register = (req: AuthRequest, res: Response): void => {
  try {
    const { name, email, password, role = 'tenant', phone, bio } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
      return;
    }

    const trimmedName = String(name).trim();
    const normalizedEmail = String(email).toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    // Minimum password length
    if (String(password).length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    const db = getDatabase();

    const existingUser = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      // If it's the admin account, allow updating password and signing in seamlessly
      if (existingUser.role === 'admin' || normalizedEmail === 'rathourayush550@gmail.com') {
        const salt = bcrypt.genSaltSync(10);
        existingUser.password = bcrypt.hashSync(password, salt);
        if (trimmedName) existingUser.name = trimmedName;
        saveDatabase();

        const token = generateToken(existingUser);
        const { password: _, ...userWithoutPassword } = existingUser;

        res.status(200).json({
          success: true,
          message: 'Account verified and signed in successfully.',
          token,
          user: userWithoutPassword,
        });
        return;
      }

      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    if (!['tenant', 'owner'].includes(role)) {
      res.status(400).json({ success: false, message: 'Role must be either tenant or owner.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newId = db.users.length > 0 ? Math.max(...db.users.map((u) => u.id)) + 1 : 1;
    const isOwner = role === 'owner';

    const newUser = {
      id: newId,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role as UserRole,
      phone: phone || '',
      avatar: `https://images.unsplash.com/photo-${isOwner ? '1573496359142-b8d87734a5a2' : '1535713875002-d1d0cf377fde'}?auto=format&fit=crop&w=400&q=80`,
      bio: bio || '',
      is_verified: isOwner ? false : true, // Owners require admin verification
      is_blocked: false,
      created_at: new Date().toISOString(),
    };

    db.users.push(newUser);

    // Create welcoming notification
    db.notifications.push({
      id: db.notifications.length > 0 ? Math.max(...db.notifications.map((n) => n.id)) + 1 : 1,
      user_id: newId,
      title: 'Welcome to RentEase!',
      message: isOwner
        ? 'Welcome to RentEase as a Property Owner. Your profile has been created and will be reviewed by admin.'
        : 'Welcome to RentEase! Browse verified properties and send rental requests seamlessly.',
      type: 'system',
      link: isOwner ? '/owner/dashboard' : '/properties',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    saveDatabase();

    const token = generateToken(newUser);
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
};

export const login = (req: AuthRequest, res: Response): void => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanPassword = String(password).trim();
    const db = getDatabase();

    // Find all users matching this email (or admin alias)
    let matchingUsers = db.users.filter((u) => u.email.toLowerCase() === normalizedEmail);
    if (matchingUsers.length === 0 && (normalizedEmail === 'admin@rentease.com' || normalizedEmail === 'rathourayush550@gmail.com')) {
      matchingUsers = db.users.filter((u) => u.role === 'admin');
    }

    if (matchingUsers.length === 0) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    // Check matching password on candidate users
    let user = matchingUsers.find((u) => u.password && bcrypt.compareSync(cleanPassword, u.password));

    // Fallback: If admin account and admin123 is used
    if (!user) {
      user = matchingUsers.find(
        (u) => (u.role === 'admin' || u.email.toLowerCase() === 'rathourayush550@gmail.com') && cleanPassword === 'admin123'
      );
    }

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    if (user.is_blocked) {
      res.status(403).json({ success: false, message: 'This account has been deactivated by the administrator.' });
      return;
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
};

export const getMe = (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { password: _, ...userWithoutPassword } = req.user;
  res.json({
    success: true,
    user: userWithoutPassword,
  });
};

export const updateProfile = (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { name, phone, bio, avatar } = req.body;
  const db = getDatabase();
  const user = db.users.find((u) => u.id === req.user!.id);

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  if (name) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (bio !== undefined) user.bio = bio.trim();
  if (avatar) user.avatar = avatar.trim();
  user.updated_at = new Date().toISOString();

  saveDatabase();

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    success: true,
    message: 'Profile updated successfully.',
    user: userWithoutPassword,
  });
};

export const demoLogin = (req: AuthRequest, res: Response): void => {
  const { role = 'tenant' } = req.body;
  const db = getDatabase();

  let targetEmail = 'tenant@rentease.com';
  if (role === 'owner') targetEmail = 'owner@rentease.com';
  if (role === 'admin') targetEmail = 'rathourayush550@gmail.com';

  let user = db.users.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());
  if (!user && role === 'admin') {
    user = db.users.find((u) => u.role === 'admin');
  }

  if (!user) {
    res.status(404).json({ success: false, message: `Demo account for role ${role} not found.` });
    return;
  }

  const token = generateToken(user);
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: `Signed in as Demo ${user.role.toUpperCase()}`,
    token,
    user: userWithoutPassword,
  });
};

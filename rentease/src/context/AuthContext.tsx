import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Notification } from '../types.ts';
import { api, getToken, setToken, removeToken } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  notifications: Notification[];
  unreadNotifications: number;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (data: any) => Promise<User>;
  demoLogin: (role: UserRole) => Promise<User>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationsAsRead: (id?: number | string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  const fetchCurrentUser = async () => {
    try {
      const currentToken = getToken();
      if (!currentToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const data = await api.auth.getMe();
      if (data.success && data.user) {
        setUser(data.user);
        await fetchNotifications();
      } else {
        removeToken();
        setUser(null);
      }
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      if (!getToken()) return;
      const res = await api.notifications.getAll();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadNotifications(res.unreadCount || 0);
      }
    } catch {
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(credentials);
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      await fetchNotifications();
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(data);
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      await fetchNotifications();
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const res = await api.auth.demoLogin(role);
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      await fetchNotifications();
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setTokenState(null);
    setUser(null);
    setNotifications([]);
    setUnreadNotifications(0);
  };

  const updateProfile = async (data: Partial<User>) => {
    const res = await api.auth.updateProfile(data);
    if (res.success) {
      setUser(res.user);
    }
  };

  const markNotificationsAsRead = async (id: number | string = 'all') => {
    try {
      await api.notifications.markRead(id);
      if (id === 'all') {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadNotifications(0);
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n.id === Number(id) ? { ...n, is_read: true } : n))
        );
        setUnreadNotifications((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        notifications,
        unreadNotifications,
        login,
        register,
        demoLogin,
        logout,
        updateProfile,
        refreshUser: fetchCurrentUser,
        refreshNotifications: fetchNotifications,
        markNotificationsAsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

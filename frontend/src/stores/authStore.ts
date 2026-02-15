import { create } from 'zustand';
import api from '../api/client';

interface AuthState {
  token: string | null;
  user: { id: string; username: string; email?: string; isAdmin?: boolean } | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isAdmin: false,

  loadFromStorage: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({
          token,
          user,
          isAuthenticated: true,
          isAdmin: user.isAdmin || false,
        });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },

  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const token = data.access_token;
    localStorage.setItem('token', token);

    const userRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = {
      id: userRes.data.id,
      username: userRes.data.username,
      email: userRes.data.email,
      isAdmin: userRes.data.is_admin,
    };
    localStorage.setItem('user', JSON.stringify(user));

    set({
      token,
      user,
      isAuthenticated: true,
      isAdmin: user.isAdmin || false,
    });
  },

  register: async (username: string, email: string, password: string) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    const token = data.access_token;
    localStorage.setItem('token', token);

    const userRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = {
      id: userRes.data.id,
      username: userRes.data.username,
      email: userRes.data.email,
      isAdmin: userRes.data.is_admin,
    };
    localStorage.setItem('user', JSON.stringify(user));

    set({
      token,
      user,
      isAuthenticated: true,
      isAdmin: user.isAdmin || false,
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false, isAdmin: false });
  },
}));

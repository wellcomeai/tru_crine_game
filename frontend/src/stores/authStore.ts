import { create } from 'zustand';
import api from '../api/client';

const ADMIN_EMAIL = 'well96well@gmail.com';

interface AuthState {
  token: string | null;
  user: { id: string; username: string; email?: string } | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
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
          isAdmin: user.email === ADMIN_EMAIL,
        });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },

  login: async (username: string, password: string) => {
    const { data } = await api.post('/auth/login', { username, password });
    const token = data.access_token;
    localStorage.setItem('token', token);

    const userRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = {
      id: userRes.data.id,
      username: userRes.data.username,
      email: userRes.data.email,
    };
    localStorage.setItem('user', JSON.stringify(user));

    set({
      token,
      user,
      isAuthenticated: true,
      isAdmin: user.email === ADMIN_EMAIL,
    });
  },

  register: async (username: string, password: string, email?: string) => {
    const { data } = await api.post('/auth/register', { username, password, email });
    const token = data.access_token;
    localStorage.setItem('token', token);

    const userRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = {
      id: userRes.data.id,
      username: userRes.data.username,
      email: userRes.data.email,
    };
    localStorage.setItem('user', JSON.stringify(user));

    set({
      token,
      user,
      isAuthenticated: true,
      isAdmin: user.email === ADMIN_EMAIL,
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false, isAdmin: false });
  },
}));

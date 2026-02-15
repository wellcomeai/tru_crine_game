import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import Button from '../UI/Button';
import { toast } from 'sonner';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-gray-400 block mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-noir-700 text-gray-200 rounded-lg px-4 py-2 border border-noir-600 focus:border-gold-dim focus:outline-none"
          placeholder="detective@mail.com"
        />
      </div>
      <div>
        <label className="text-sm text-gray-400 block mb-1">Пароль</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-noir-700 text-gray-200 rounded-lg px-4 py-2 border border-noir-600 focus:border-gold-dim focus:outline-none"
          placeholder="••••••"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Входим...' : 'Войти'}
      </Button>
    </form>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import { useAuthStore } from '../stores/authStore';

export default function LandingPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/cases');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-[100dvh] bg-noir-900 flex items-center justify-center vignette scanlines relative">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-5xl font-bold text-gold mb-2">
            DETECTIVE AI
          </h1>
          <p className="text-gray-500 text-sm">
            Интерактивная детективная игра с AI-допросами
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-xl p-6">
          {/* Tabs */}
          <div className="flex mb-6 bg-noir-700 rounded-lg p-1">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'login'
                  ? 'bg-gold text-noir-900'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'register'
                  ? 'bg-gold text-noir-900'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Регистрация
            </button>
          </div>

          {tab === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Расследуйте убийства. Допрашивайте подозреваемых. Найдите истину.
        </p>
      </motion.div>
    </div>
  );
}

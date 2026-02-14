import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import CasePreviewModal from '../components/Game/CasePreviewModal';
import { LogOut, Clock, BarChart3, Settings } from 'lucide-react';
import { getImageUrl } from '../utils/helpers';
import { DIFFICULTY_LABELS } from '../utils/constants';
import type { Case } from '../types';

interface CaseDetail {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  cover_image?: string | null;
  phases?: Array<{ id: string; name: string; description: string }>;
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuthStore();
  const { startCase } = useGameStore();

  const [previewCase, setPreviewCase] = useState<CaseDetail | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    api.get('/cases')
      .then(({ data }) => setCases(data))
      .finally(() => setLoading(false));
  }, []);

  const handleCaseClick = async (caseItem: Case) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const { data } = await api.get(`/cases/${caseItem.id}`);
      setPreviewCase(data);
    } catch (err) {
      console.error('Failed to load case details:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleStartFromPreview = async (caseId: string) => {
    setPreviewOpen(false);
    const sessionId = await startCase(caseId);
    navigate(`/game/${sessionId}`);
  };

  const handleStart = async (caseId: string) => {
    const sessionId = await startCase(caseId);
    navigate(`/game/${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-noir-900">
      {/* Header */}
      <div className="bg-noir-800 border-b border-noir-600">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-gold">DETECTIVE AI</h1>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="text-gray-500 hover:text-amber-400 transition-colors"
                title="Админ-панель"
              >
                <Settings size={18} />
              </button>
            )}
            <span className="text-gray-400 text-sm">{user?.username}</span>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="font-serif text-xl text-gray-300 mb-6">Выберите дело</h2>

        {loading ? (
          <div className="py-12"><LoadingSpinner /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-xl overflow-hidden hover:border-gold-dim transition-colors cursor-pointer"
                onClick={() => handleCaseClick(c)}
              >
                {/* Cover */}
                <div className="h-48 bg-noir-700 relative">
                  {c.cover_image && (
                    <img
                      src={getImageUrl(c.cover_image)}
                      alt={c.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-noir-900/80 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <h3 className="font-serif text-lg font-bold text-gray-100">{c.title}</h3>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <p className="text-sm text-gray-400 line-clamp-2">{c.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <BarChart3 size={12} />
                      {DIFFICULTY_LABELS[c.difficulty] || c.difficulty}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      ~{c.estimated_time_min} мин
                    </span>
                  </div>
                  <Button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleStart(c.id);
                    }}
                    className="w-full"
                    size="sm"
                  >
                    Начать расследование
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CasePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        caseData={previewCase}
        onStart={handleStartFromPreview}
        loading={previewLoading}
      />
    </div>
  );
}

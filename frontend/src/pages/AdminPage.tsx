import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { Loader2, Check, X, Eye, EyeOff, Trash2, ArrowLeft } from 'lucide-react';

interface AdminCase {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  is_published: boolean;
  created_at: string | null;
}

interface ProgressData {
  step: number;
  total: number;
  message: string;
  status: string;
  case_id?: string;
  case_slug?: string;
}

export default function AdminPage() {
  const { isAdmin } = useAuthStore();
  const navigate = useNavigate();

  const [cases, setCases] = useState<AdminCase[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [theme, setTheme] = useState('');
  const [setting, setSetting] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numSuspects, setNumSuspects] = useState(4);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/cases');
      return;
    }
    loadCases();
  }, [isAdmin, navigate]);

  const loadCases = async () => {
    try {
      const { data } = await api.get('/admin/cases');
      setCases(data);
    } catch (err) {
      console.error('Failed to load admin cases:', err);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress(null);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/generate-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          theme: theme || null,
          setting: setting || null,
          difficulty,
          num_suspects: numSuspects,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || `HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: ProgressData = JSON.parse(line.slice(6));
              setProgress(data);

              if (data.status === 'completed') {
                await loadCases();
              }
              if (data.status === 'error') {
                setError(data.message);
              }
            } catch {
              // skip malformed events
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async (caseId: string) => {
    await api.post(`/admin/cases/${caseId}/publish`);
    loadCases();
  };

  const handleUnpublish = async (caseId: string) => {
    await api.post(`/admin/cases/${caseId}/unpublish`);
    loadCases();
  };

  const handleDelete = async (caseId: string) => {
    if (!confirm('Удалить это дело?')) return;
    try {
      await api.delete(`/admin/cases/${caseId}`);
      loadCases();
    } catch (err) {
      alert('Нельзя удалить опубликованное дело. Сначала снимите с публикации.');
    }
  };

  const progressPercent = progress ? (progress.step / progress.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-200">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/cases')} className="text-gray-500 hover:text-gray-300">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-serif text-xl font-bold text-amber-400">Админ-панель</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* Generation form */}
        <section>
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Сгенерировать новое дело</h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Тема</label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Например: убийство на яхте"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Сеттинг</label>
                <input
                  type="text"
                  value={setting}
                  onChange={(e) => setSetting(e.target.value)}
                  placeholder="Например: Москва, 2024"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Сложность</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-600"
                >
                  <option value="easy">Лёгкое</option>
                  <option value="medium">Среднее</option>
                  <option value="hard">Сложное</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Подозреваемых</label>
                <select
                  value={numSuspects}
                  onChange={(e) => setNumSuspects(Number(e.target.value))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-600"
                >
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-2.5 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Генерация...
                </>
              ) : (
                'Сгенерировать дело'
              )}
            </button>
          </div>

          {/* Progress bar */}
          {generating && progress && (
            <div className="mt-4 p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>{progress.message}</span>
                <span>{progress.step}/{progress.total}</span>
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-3">
                <div
                  className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Completion / error */}
          {!generating && progress?.status === 'completed' && (
            <div className="mt-4 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Check size={18} className="text-green-400" />
                <span className="text-sm font-medium text-green-400">Генерация завершена</span>
              </div>
              {progress.case_slug && (
                <p className="text-sm text-gray-500">
                  Slug: <code className="text-amber-400">{progress.case_slug}</code>
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 bg-neutral-900 border border-red-900/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <X size={18} className="text-red-400" />
                <span className="text-sm font-medium text-red-400">Ошибка генерации</span>
              </div>
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
        </section>

        {/* Cases table */}
        <section>
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Все дела</h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-gray-500">
                  <th className="px-4 py-3">Название</th>
                  <th className="px-4 py-3">Сложность</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Дата</th>
                  <th className="px-4 py-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                    <td className="px-4 py-3 text-gray-200">{c.title}</td>
                    <td className="px-4 py-3 text-gray-400 capitalize">{c.difficulty}</td>
                    <td className="px-4 py-3">
                      {c.is_published ? (
                        <span className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded-full">
                          Опубликовано
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-neutral-700/50 text-gray-500 text-xs rounded-full">
                          Черновик
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('ru-RU') : '\u2014'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.is_published ? (
                          <button
                            onClick={() => handleUnpublish(c.id)}
                            title="Снять с публикации"
                            className="p-1 text-gray-500 hover:text-amber-400 transition-colors"
                          >
                            <EyeOff size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublish(c.id)}
                            title="Опубликовать"
                            className="p-1 text-gray-500 hover:text-green-400 transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(c.id)}
                          title="Удалить"
                          className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {cases.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-600">
                      Нет дел
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

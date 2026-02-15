import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { getImageUrl } from '../utils/helpers';
import { toast } from 'sonner';
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  MapPin,
  User,
  Search,
  Link2,
  Shield,
  Clock,
  Star,
} from 'lucide-react';

interface CasePreview {
  case: {
    id: string;
    slug: string;
    title: string;
    description: string;
    difficulty: string;
    estimated_time_min: number;
    cover_image: string;
    is_published: boolean;
    solution: {
      guilty: string;
      motive: string;
      method: string;
      weapon?: string;
      key_evidence: string[];
    };
    phases: Array<{
      id: string;
      name: string;
      description: string;
      sort_order: number;
    }>;
  };
  locations: Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
    image: string;
    is_initial: boolean;
    sort_order: number;
    points_of_interest: Array<{
      id: string;
      label: string;
      evidence_slug?: string | null;
    }>;
  }>;
  characters: Array<{
    id: string;
    slug: string;
    name: string;
    role: string;
    age: number;
    occupation: string;
    avatar: string;
    personality: string;
    backstory: string;
    is_guilty: boolean;
    alibi: string;
    secrets: Array<{ id: string; content: string }>;
    ai_system_prompt: string;
  }>;
  evidence: Array<{
    id: string;
    slug: string;
    name: string;
    type: string;
    description: string;
    detailed_description: string;
    image: string;
    location_slug: string;
    importance: number;
    tags: string[];
    is_key_evidence: boolean;
  }>;
  evidence_connections: Array<{
    evidence_a_slug: string;
    evidence_b_slug: string;
    connection_type: string;
    description: string;
    is_key_connection: boolean;
  }>;
}

const EVIDENCE_TYPE_EMOJI: Record<string, string> = {
  physical: '🔍',
  document: '📄',
  testimony: '💬',
  digital: '💻',
  forensic: '🧪',
  financial: '💰',
  photo: '📷',
  weapon: '🔪',
};

export default function AdminCasePreviewPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();

  const [data, setData] = useState<CasePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/cases');
      return;
    }
    loadPreview();
  }, [caseId, isAdmin]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      const { data: preview } = await api.get(`/admin/cases/${caseId}/preview`);
      setData(preview);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load preview');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (entityType: string, entitySlug: string) => {
    const key = `${entityType}:${entitySlug}`;
    setRegenerating(key);
    try {
      const { data: result } = await api.post(`/admin/cases/${caseId}/regenerate-image`, {
        entity_type: entityType,
        entity_slug: entitySlug,
      });

      if (result.new_image_url && data) {
        const updated = { ...data };
        if (entityType === 'cover') {
          updated.case = { ...updated.case, cover_image: result.new_image_url };
        } else if (entityType === 'location') {
          updated.locations = updated.locations.map((loc) =>
            loc.slug === entitySlug ? { ...loc, image: result.new_image_url } : loc
          );
        } else if (entityType === 'character') {
          updated.characters = updated.characters.map((ch) =>
            ch.slug === entitySlug ? { ...ch, avatar: result.new_image_url } : ch
          );
        } else if (entityType === 'evidence') {
          updated.evidence = updated.evidence.map((ev) =>
            ev.slug === entitySlug ? { ...ev, image: result.new_image_url } : ev
          );
        }
        setData(updated);
      }
      toast.success('Изображение перегенерировано');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка перегенерации');
    } finally {
      setRegenerating(null);
    }
  };

  const RegenerateButton = ({
    entityType,
    entitySlug,
    label = 'Перегенерировать',
  }: {
    entityType: string;
    entitySlug: string;
    label?: string;
  }) => {
    const key = `${entityType}:${entitySlug}`;
    const isLoading = regenerating === key;
    return (
      <button
        onClick={() => handleRegenerate(entityType, entitySlug)}
        disabled={regenerating !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-gray-400 hover:text-amber-400 hover:border-amber-600/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <RefreshCw size={12} />
        )}
        {isLoading ? 'Генерация...' : label}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-400" size={32} />
      </div>
    );
  }

  if (!data) return null;

  const { case: caseInfo, locations, characters, evidence, evidence_connections } = data;

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-200">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="text-gray-500 hover:text-gray-300"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-serif text-xl font-bold text-amber-400 truncate">
              Превью: {caseInfo.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {caseInfo.is_published ? (
              <span className="px-3 py-1 bg-green-900/30 text-green-400 text-xs rounded-full">
                Опубликовано
              </span>
            ) : (
              <span className="px-3 py-1 bg-neutral-700/50 text-gray-500 text-xs rounded-full">
                Черновик
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {/* Cover */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
              <Shield size={18} className="text-amber-400" />
              Обложка
            </h2>
            <RegenerateButton entityType="cover" entitySlug="cover" label="Перегенерировать обложку" />
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            {caseInfo.cover_image ? (
              <img
                src={getImageUrl(caseInfo.cover_image)}
                alt={caseInfo.title}
                className="w-full max-h-[400px] object-cover"
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-600">
                Нет обложки
              </div>
            )}
          </div>
        </section>

        {/* Case info */}
        <section>
          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Search size={18} className="text-amber-400" />
            Информация о деле
          </h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-gray-500">Slug</span>
                <p className="text-sm text-amber-400 font-mono">{caseInfo.slug}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Сложность</span>
                <p className="text-sm text-gray-200 capitalize">{caseInfo.difficulty}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Время</span>
                <p className="text-sm text-gray-200 flex items-center gap-1">
                  <Clock size={14} /> ~{caseInfo.estimated_time_min} мин
                </p>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Описание</span>
              <p className="text-sm text-gray-300 mt-1">{caseInfo.description}</p>
            </div>

            {/* Solution */}
            <div className="border-t border-neutral-800 pt-4">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Разгадка</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <div>
                  <span className="text-xs text-gray-500">Виновный</span>
                  <p className="text-sm text-red-400 font-medium">{caseInfo.solution.guilty}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Мотив</span>
                  <p className="text-sm text-gray-300">{caseInfo.solution.motive}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Метод</span>
                  <p className="text-sm text-gray-300">{caseInfo.solution.method}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Ключевые улики</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {caseInfo.solution.key_evidence.map((slug) => (
                      <span
                        key={slug}
                        className="px-2 py-0.5 bg-amber-900/30 text-amber-400 text-xs rounded"
                      >
                        {slug}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Phases */}
            {caseInfo.phases && caseInfo.phases.length > 0 && (
              <div className="border-t border-neutral-800 pt-4">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Фазы</span>
                <div className="space-y-2 mt-2">
                  {caseInfo.phases
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((phase) => (
                      <div key={phase.id} className="flex gap-3 items-start">
                        <span className="text-xs text-amber-400 font-mono mt-0.5">
                          {phase.sort_order}.
                        </span>
                        <div>
                          <p className="text-sm text-gray-200 font-medium">{phase.name}</p>
                          <p className="text-xs text-gray-500">{phase.description}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Locations */}
        <section>
          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-amber-400" />
            Локации ({locations.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden"
              >
                {loc.image ? (
                  <div className="relative">
                    <img
                      src={getImageUrl(loc.image)}
                      alt={loc.name}
                      className="w-full h-48 object-cover"
                    />
                    {loc.is_initial && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-600 text-white text-xs rounded">
                        initial
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="h-32 bg-neutral-800 flex items-center justify-center text-gray-600 relative">
                    <MapPin size={24} />
                    {loc.is_initial && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-600 text-white text-xs rounded">
                        initial
                      </span>
                    )}
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-200">{loc.name}</h3>
                    <span className="text-xs text-gray-600 font-mono">{loc.slug}</span>
                  </div>
                  <p className="text-xs text-gray-400">{loc.description}</p>
                  {loc.points_of_interest.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-500">POI ({loc.points_of_interest.length}):</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {loc.points_of_interest.map((poi) => (
                          <span
                            key={poi.id}
                            className={`px-1.5 py-0.5 text-xs rounded ${
                              poi.evidence_slug
                                ? 'bg-amber-900/30 text-amber-400'
                                : 'bg-neutral-800 text-gray-500'
                            }`}
                          >
                            {poi.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <RegenerateButton
                    entityType="location"
                    entitySlug={loc.slug}
                    label="Перегенерировать фото"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Characters */}
        <section>
          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <User size={18} className="text-amber-400" />
            Персонажи ({characters.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((ch) => (
              <div
                key={ch.id}
                className={`bg-neutral-900 border rounded-xl overflow-hidden ${
                  ch.is_guilty ? 'border-red-800/50' : 'border-neutral-800'
                }`}
              >
                <div className="flex gap-4 p-4">
                  <div className="flex-shrink-0">
                    {ch.avatar ? (
                      <img
                        src={getImageUrl(ch.avatar)}
                        alt={ch.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-neutral-800 flex items-center justify-center text-gray-600">
                        <User size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-200 truncate">{ch.name}</h3>
                      {ch.is_guilty && (
                        <span className="px-1.5 py-0.5 bg-red-900/40 text-red-400 text-xs rounded flex-shrink-0">
                          GUILTY
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {ch.occupation} | {ch.age} лет
                    </p>
                    <p className="text-xs text-gray-600 font-mono">{ch.slug}</p>
                  </div>
                </div>
                <div className="px-4 pb-4 space-y-2">
                  <div>
                    <span className="text-xs text-gray-500">Характер</span>
                    <p className="text-xs text-gray-400 line-clamp-2">{ch.personality}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Предыстория</span>
                    <p className="text-xs text-gray-400 line-clamp-3">{ch.backstory}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Алиби</span>
                    <p className="text-xs text-gray-400 line-clamp-2">{ch.alibi}</p>
                  </div>
                  {ch.secrets && ch.secrets.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-500">
                        Секреты ({ch.secrets.length})
                      </span>
                      {ch.secrets.map((s) => (
                        <p key={s.id} className="text-xs text-red-400/70 line-clamp-1">
                          {s.content}
                        </p>
                      ))}
                    </div>
                  )}
                  <RegenerateButton
                    entityType="character"
                    entitySlug={ch.slug}
                    label="Перегенерировать аватар"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Evidence */}
        <section>
          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Star size={18} className="text-amber-400" />
            Улики ({evidence.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evidence.map((ev) => (
              <div
                key={ev.id}
                className={`bg-neutral-900 border rounded-xl overflow-hidden ${
                  ev.is_key_evidence ? 'border-amber-700/50' : 'border-neutral-800'
                }`}
              >
                {ev.image ? (
                  <img
                    src={getImageUrl(ev.image)}
                    alt={ev.name}
                    className="w-full h-36 object-cover"
                  />
                ) : (
                  <div className="h-20 bg-neutral-800 flex items-center justify-center text-2xl">
                    {EVIDENCE_TYPE_EMOJI[ev.type] || '🔍'}
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-gray-200 text-sm truncate">{ev.name}</h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {ev.is_key_evidence && (
                        <span className="px-1.5 py-0.5 bg-amber-900/40 text-amber-400 text-xs rounded">
                          KEY
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 bg-neutral-800 text-gray-500 text-xs rounded">
                        {ev.type}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">{ev.description}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{ev.detailed_description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="font-mono">{ev.slug}</span>
                    <span>Важность: {ev.importance}/10</span>
                  </div>
                  {ev.location_slug && (
                    <p className="text-xs text-gray-600">
                      Локация: <span className="text-gray-400">{ev.location_slug}</span>
                    </p>
                  )}
                  {ev.tags && ev.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {ev.tags.map((tag, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-neutral-800 text-gray-500 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <RegenerateButton
                    entityType="evidence"
                    entitySlug={ev.slug}
                    label="Перегенерировать фото"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Evidence connections */}
        <section>
          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Link2 size={18} className="text-amber-400" />
            Связи улик ({evidence_connections.length})
          </h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-gray-500">
                  <th className="px-4 py-3">Улика A</th>
                  <th className="px-4 py-3">Улика B</th>
                  <th className="px-4 py-3">Тип</th>
                  <th className="px-4 py-3">Описание</th>
                  <th className="px-4 py-3">Ключ</th>
                </tr>
              </thead>
              <tbody>
                {evidence_connections.map((conn, i) => (
                  <tr key={i} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                    <td className="px-4 py-2 text-amber-400 font-mono text-xs">
                      {conn.evidence_a_slug}
                    </td>
                    <td className="px-4 py-2 text-amber-400 font-mono text-xs">
                      {conn.evidence_b_slug}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{conn.connection_type}</td>
                    <td className="px-4 py-2 text-gray-300 text-xs max-w-xs truncate">
                      {conn.description}
                    </td>
                    <td className="px-4 py-2">
                      {conn.is_key_connection && (
                        <span className="px-1.5 py-0.5 bg-amber-900/40 text-amber-400 text-xs rounded">
                          KEY
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {evidence_connections.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-600">
                      Нет связей
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

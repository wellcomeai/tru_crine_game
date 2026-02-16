import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import GameLayout from '../components/Layout/GameLayout';
import PointOfInterest from '../components/Game/PointOfInterest';
import Modal from '../components/UI/Modal';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { useGameStore } from '../stores/gameStore';
import { getImageUrl } from '../utils/helpers';
import { toast } from 'sonner';

export default function LocationPage() {
  const { sessionId, slug } = useParams<{ sessionId: string; slug: string }>();
  const navigate = useNavigate();
  const { locations, examinePoi, visitLocation, loadLocations, loadState } = useGameStore();
  const [examineResult, setExamineResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const location = locations.find((l) => l.slug === slug);

  useEffect(() => {
    if (!location && sessionId) {
      loadLocations();
      loadState();
    }
  }, [location, sessionId]);

  // Auto-visit if not visited
  useEffect(() => {
    if (location && !location.is_visited) {
      visitLocation(slug!);
    }
  }, [location?.is_visited, slug]);

  const handleExamine = async (poiId: string) => {
    if (!sessionId || !slug) return;
    setLoading(true);
    try {
      const result = await examinePoi(slug, poiId);
      setExamineResult(result);
      if (result.evidence) {
        toast.success(`Найдена улика: ${result.evidence.name}!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка осмотра');
    } finally {
      setLoading(false);
    }
  };

  if (!location) {
    return (
      <GameLayout>
        <LoadingSpinner size={48} />
      </GameLayout>
    );
  }

  return (
    <GameLayout noPadding>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Back button + location name — overlay */}
        <div className="absolute top-[4.5rem] left-[5rem] lg:left-[13.5rem]
                        z-30 flex items-center gap-3">
          <button
            onClick={() => navigate(`/game/${sessionId}`)}
            className="flex items-center gap-1.5
                       text-gray-400 hover:text-gray-200
                       transition-colors
                       bg-noir-900/60 backdrop-blur-sm
                       rounded-lg px-3 py-1.5
                       border border-noir-600/30
                       hover:border-noir-500/50"
          >
            <ArrowLeft size={16} />
            <span className="text-xs hidden sm:inline">Назад</span>
          </button>
          <h2 className="font-serif text-lg text-gold
                         bg-noir-900/40 backdrop-blur-sm
                         px-3 py-1 rounded-lg
                         border border-gold/10">
            {location.name}
          </h2>
        </div>

        {/* Image — full screen */}
        <div className="flex-1 relative min-h-0">
          {location.image ? (
            <img
              src={getImageUrl(location.image)}
              alt={location.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0
                            bg-gradient-to-b from-noir-800 to-noir-900
                            flex items-center justify-center
                            text-noir-500 text-lg">
              {location.name}
            </div>
          )}

          {/* Points of interest — over image */}
          {location.points_of_interest.map((poi) => (
            <PointOfInterest
              key={poi.id}
              poi={poi}
              onClick={() => handleExamine(poi.id)}
            />
          ))}

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-black/50
                            flex items-center justify-center z-20">
              <LoadingSpinner />
            </div>
          )}

          {/* Bottom gradient for description readability */}
          {location.description && (
            <div className="absolute bottom-0 left-0 right-0
                            bg-gradient-to-t from-black/70
                            via-black/30 to-transparent
                            px-6 pb-4 pt-12 z-10
                            pointer-events-none">
              <p className="text-gray-300 text-sm max-w-2xl">
                {location.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Examine result modal */}
      <Modal
        isOpen={!!examineResult}
        onClose={() => setExamineResult(null)}
        title={examineResult?.evidence ? 'Улика найдена!' : 'Осмотр'}
      >
        {examineResult && (
          <div className="space-y-4">
            <p className="text-gray-300">{examineResult.examine_text}</p>
            {examineResult.evidence && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gold/10 border border-gold/30 rounded-lg p-4 gold-glow"
                >
                  <h4 className="font-serif font-bold text-gold mb-1">
                    {examineResult.evidence.name}
                  </h4>
                  <p className="text-sm text-gray-400">{examineResult.evidence.description}</p>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        )}
      </Modal>
    </GameLayout>
  );
}

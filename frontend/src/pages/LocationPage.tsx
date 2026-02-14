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
    <GameLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(`/game/${sessionId}`)}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-serif text-xl text-gold">{location.name}</h2>
      </div>

      {/* Location image with POIs */}
      <div className="relative rounded-xl overflow-hidden bg-noir-700 aspect-video max-h-[70vh]">
        {location.image ? (
          <img
            src={getImageUrl(location.image)}
            alt={location.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-noir-500 text-lg">
            {location.name}
          </div>
        )}

        {/* Points of interest */}
        {location.points_of_interest.map((poi) => (
          <PointOfInterest
            key={poi.id}
            poi={poi}
            onClick={() => handleExamine(poi.id)}
          />
        ))}

        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}
      </div>

      {/* Description */}
      {location.description && (
        <p className="text-gray-400 text-sm mt-4">{location.description}</p>
      )}

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

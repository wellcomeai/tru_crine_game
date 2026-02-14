import { motion } from 'framer-motion';
import { MapPin, Lock, CheckCircle, Sparkles } from 'lucide-react';
import type { Location } from '../../types';
import { getImageUrl } from '../../utils/helpers';

interface LocationCardProps {
  location: Location;
  onClick: () => void;
}

export default function LocationCard({ location, onClick }: LocationCardProps) {
  const examinedCount = location.points_of_interest.filter((p) => p.is_examined).length;
  const totalPois = location.points_of_interest.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={location.is_locked ? {} : { scale: 1.02 }}
      onClick={location.is_locked ? undefined : onClick}
      className={`relative rounded-xl overflow-hidden border transition-all ${
        location.is_locked
          ? 'border-noir-600 opacity-50 cursor-not-allowed'
          : location.is_visited
          ? 'border-noir-500 cursor-pointer hover:border-gold-dim'
          : 'border-gold-dim cursor-pointer hover:border-gold gold-glow'
      }`}
    >
      {/* Image */}
      <div className="h-40 bg-noir-700 relative">
        {location.image ? (
          <img
            src={getImageUrl(location.image)}
            alt={location.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          {!location.image && <MapPin size={32} className="text-noir-500" />}
        </div>

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          {location.is_locked ? (
            <span className="bg-noir-700/80 text-gray-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Lock size={12} /> Заблокирована
            </span>
          ) : !location.is_visited ? (
            <span className="bg-gold/90 text-noir-900 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-semibold">
              <Sparkles size={12} /> Новая!
            </span>
          ) : examinedCount === totalPois ? (
            <span className="bg-green-900/80 text-green-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle size={12} /> Осмотрена
            </span>
          ) : null}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-noir-800">
        <h3 className="font-serif font-bold text-gray-200">{location.name}</h3>
        {location.is_visited && totalPois > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            Осмотрено: {examinedCount}/{totalPois}
          </div>
        )}
      </div>
    </motion.div>
  );
}

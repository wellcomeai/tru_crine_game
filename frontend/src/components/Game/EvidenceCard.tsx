import { motion } from 'framer-motion';
import type { Evidence } from '../../types';
import { getImageUrl } from '../../utils/helpers';
import { EVIDENCE_TYPE_ICONS } from '../../utils/constants';

interface EvidenceCardProps {
  evidence: Evidence;
  onClick: () => void;
  compact?: boolean;
}

export default function EvidenceCard({ evidence, onClick, compact }: EvidenceCardProps) {
  const icon = EVIDENCE_TYPE_ICONS[evidence.type || ''] || '🔍';

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={onClick}
        className="flex items-center gap-2 p-2 bg-noir-700 rounded-lg border border-noir-600 cursor-pointer hover:border-gold-dim transition-all"
      >
        <span>{icon}</span>
        <span className="text-sm text-gray-300 truncate">{evidence.name}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="rounded-xl overflow-hidden border border-noir-500 cursor-pointer hover:border-gold-dim transition-all"
    >
      <div className="h-28 bg-noir-700 relative flex items-center justify-center">
        {evidence.image ? (
          <img
            src={getImageUrl(evidence.image)}
            alt={evidence.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className="text-3xl">{icon}</span>
        )}
        {evidence.is_key_evidence && (
          <div className="absolute top-2 right-2 bg-gold/90 text-noir-900 text-xs px-1.5 py-0.5 rounded font-bold">
            KEY
          </div>
        )}
      </div>
      <div className="p-3 bg-noir-800">
        <h3 className="font-serif font-bold text-sm text-gray-200 truncate">{evidence.name}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{evidence.description}</p>
        <div className="flex gap-1 mt-2 flex-wrap">
          {evidence.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-noir-700 text-gray-400 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

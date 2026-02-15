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
        className="relative group flex items-center gap-2 p-2 bg-noir-700 rounded-lg border border-noir-600 cursor-pointer hover:border-gold-dim transition-all"
      >
        <span>{icon}</span>
        <span className="text-sm text-gray-300 truncate">{evidence.name}</span>
        {evidence.is_key_evidence && (
          <span className="text-xs text-gold bg-gold/10 px-1 py-0.5 rounded ml-auto flex-shrink-0">
            KEY
          </span>
        )}

        {/* Tooltip on hover */}
        {evidence.description && (
          <div className="absolute left-0 bottom-full mb-2 z-50
                          opacity-0 group-hover:opacity-100
                          transition-opacity duration-200
                          pointer-events-none w-72 max-w-sm">
            <div className="bg-noir-800 border border-noir-500 rounded-lg
                            shadow-xl shadow-black/40 p-3">
              {/* Arrow down */}
              <div className="absolute -bottom-[5px] left-6
                              w-2.5 h-2.5 bg-noir-800 border-r border-b
                              border-noir-500 rotate-45" />
              {/* Name */}
              <p className="text-xs font-semibold text-gold mb-1">
                {evidence.name}
              </p>
              {/* Type + importance */}
              <div className="flex items-center gap-2 mb-1.5">
                {evidence.type && (
                  <span className="text-[10px] text-gray-500 bg-noir-700
                                   px-1.5 py-0.5 rounded">
                    {evidence.type}
                  </span>
                )}
                <span className="text-[10px] text-gray-600">
                  Важность: {'★'.repeat(evidence.importance)}{'☆'.repeat(5 - evidence.importance)}
                </span>
              </div>
              {/* Description */}
              <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3">
                {evidence.description}
              </p>
              {/* Tags */}
              {evidence.tags && evidence.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {evidence.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-[10px] bg-noir-700
                                               text-gray-500 px-1.5 py-0.5
                                               rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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
            loading="lazy"
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

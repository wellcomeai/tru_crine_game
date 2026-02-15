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
        whileHover={{ scale: 1.01 }}
        onClick={onClick}
        className="relative group flex items-center gap-2.5 p-2.5
                   bg-noir-700 rounded-lg border border-noir-600
                   cursor-pointer hover:border-gold-dim/50
                   hover:bg-noir-700/80 transition-all"
      >
        {/* Type icon */}
        <span className="text-base flex-shrink-0">{icon}</span>

        {/* Name */}
        <span className="text-sm text-gray-300 truncate flex-1">
          {evidence.name}
        </span>

        {/* KEY badge */}
        {evidence.is_key_evidence && (
          <span className="text-[10px] text-gold bg-gold/10
                           px-1.5 py-0.5 rounded font-bold
                           flex-shrink-0 tracking-wide">
            KEY
          </span>
        )}

        {/* Tooltip */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3
                        z-50 opacity-0 group-hover:opacity-100
                        transition-opacity duration-200
                        pointer-events-none w-72">
          <div className="bg-noir-800 border border-noir-500/80
                          rounded-xl shadow-2xl shadow-black/60 p-4
                          relative">

            {/* Arrow left */}
            <div className="absolute top-1/2 -left-[6px] -translate-y-1/2
                            w-3 h-3 bg-noir-800 border-l border-b
                            border-noir-500/80 rotate-45" />

            {/* Header: icon + name */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{icon}</span>
              <h4 className="text-sm font-semibold text-gold
                             font-serif leading-tight">
                {evidence.name}
              </h4>
            </div>

            {/* Meta: type + importance */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] text-gray-400 bg-noir-700
                               px-2 py-0.5 rounded-md border border-noir-600/50
                               uppercase tracking-wider">
                {evidence.type || 'улика'}
              </span>
              <span className="text-[11px] text-gold/60">
                {'★'.repeat(evidence.importance)}
                {'☆'.repeat(Math.max(0, 5 - evidence.importance))}
              </span>
            </div>

            {/* Description */}
            {evidence.description && (
              <p className="text-[11px] text-gray-400 leading-relaxed
                            line-clamp-3 mb-2">
                {evidence.description}
              </p>
            )}

            {/* Tags */}
            {evidence.tags && evidence.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap pt-1.5
                              border-t border-noir-600/30">
                {evidence.tags.slice(0, 4).map((tag) => (
                  <span key={tag}
                        className="text-[10px] bg-noir-700/80
                                   text-gray-500 px-1.5 py-0.5
                                   rounded-md">
                    #{tag}
                  </span>
                ))}
                {evidence.tags.length > 4 && (
                  <span className="text-[10px] text-gray-600">
                    +{evidence.tags.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
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

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';
import { EVIDENCE_TYPE_ICONS } from '../../utils/constants';
import { useMobile } from '../../hooks/useMobile';

interface EvidenceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (slug: string, name: string) => void;
}

export default function EvidenceSelector({ isOpen, onClose, onSelect }: EvidenceSelectorProps) {
  const { evidence } = useGameStore();
  const { isMobile } = useMobile();
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const handleSelect = (slug: string, name: string) => {
    onSelect(slug, name);
    onClose();
  };

  const content = (
    <div className="space-y-2">
      {evidence.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">Нет собранных улик</p>
      ) : (
        evidence.map((ev) => {
          const icon = EVIDENCE_TYPE_ICONS[ev.type || ''] || '🔍';
          const isExpanded = expandedSlug === ev.slug;

          return (
            <div key={ev.slug}>
              <button
                onClick={() => {
                  if (isMobile) {
                    if (isExpanded) {
                      handleSelect(ev.slug, ev.name);
                    } else {
                      setExpandedSlug(ev.slug);
                    }
                  } else {
                    handleSelect(ev.slug, ev.name);
                  }
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all min-h-[44px]
                  flex items-center gap-3
                  ${isExpanded
                    ? 'border-gold/40 bg-gold/5'
                    : 'border-noir-600 bg-noir-700 hover:border-gold/20 active:bg-noir-600'
                  }`}
              >
                <span className="text-lg flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{ev.name}</p>
                  {isExpanded && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ev.description}</p>
                  )}
                </div>
                {ev.is_key_evidence && (
                  <span className="text-[9px] text-gold bg-gold/10 px-1.5 py-0.5 rounded font-bold flex-shrink-0">
                    KEY
                  </span>
                )}
                {isExpanded && (
                  <span className="text-[10px] text-gold flex-shrink-0">Предъявить</span>
                )}
              </button>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {isMobile ? (
            /* Bottom Sheet on mobile */
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 300) {
                  onClose();
                }
              }}
              className="fixed bottom-0 left-0 right-0 z-50
                         bg-noir-800 rounded-t-2xl
                         border-t border-noir-600
                         max-h-[70vh] flex flex-col"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-noir-500" />
              </div>
              <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0">
                <h3 className="font-serif text-base text-gold">Предъявить улику</h3>
                <button
                  onClick={onClose}
                  className="text-gray-500 active:text-gray-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-4 pb-4">
                {content}
              </div>
            </motion.div>
          ) : (
            /* Centered modal on desktop */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-noir-800 rounded-xl border border-noir-600
                           max-w-md w-full max-h-[70vh] overflow-hidden shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-noir-600/50">
                  <h3 className="font-serif text-lg text-gold">Предъявить улику</h3>
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 p-4">
                  {content}
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

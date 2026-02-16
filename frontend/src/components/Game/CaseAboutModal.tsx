import { X, Star, Clock, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl, getInitials } from '../../utils/helpers';
import { DIFFICULTY_LABELS, ROLE_LABELS } from '../../utils/constants';
import type { Character, Phase } from '../../types';

interface CaseAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: {
    title: string;
    description: string | null;
    difficulty: string;
    cover_image: string | null;
  } | null;
  phases: Phase[];
  characters: Character[];
}

const DIFFICULTY_META: Record<string, { stars: number; time: string }> = {
  easy: { stars: 1, time: '~30 мин' },
  medium: { stars: 2, time: '~45 мин' },
  hard: { stars: 3, time: '~60 мин' },
};

export default function CaseAboutModal({
  isOpen,
  onClose,
  caseData,
  phases,
  characters,
}: CaseAboutModalProps) {
  if (!caseData) return null;

  const meta = DIFFICULTY_META[caseData.difficulty] || DIFFICULTY_META.medium;

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

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-neutral-900 rounded-xl border border-neutral-700/50
                         shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cover */}
              <div className="relative h-40 sm:h-48 overflow-hidden rounded-t-xl">
                {caseData.cover_image ? (
                  <img
                    src={getImageUrl(caseData.cover_image)}
                    alt={caseData.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br
                                  from-neutral-800 to-neutral-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t
                                from-neutral-900 via-transparent" />

                {/* Title over cover */}
                <div className="absolute bottom-4 left-6 right-12">
                  <h2
                    className="text-2xl font-bold text-amber-300"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {caseData.title}
                  </h2>
                </div>

                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 p-1.5 bg-black/50
                             rounded-full text-neutral-400
                             hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">

                {/* Meta: difficulty + time */}
                <div className="flex items-center gap-4 text-sm text-neutral-400">
                  <span className="flex items-center gap-1">
                    {Array.from({ length: meta.stars }).map((_, i) => (
                      <Star key={i} size={14}
                            className="text-amber-400 fill-amber-400" />
                    ))}
                    <span className="ml-1">
                      {DIFFICULTY_LABELS[caseData.difficulty]
                       || caseData.difficulty}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {meta.time}
                  </span>
                </div>

                {/* Description */}
                {caseData.description && (
                  <p className="text-neutral-300 leading-relaxed">
                    {caseData.description}
                  </p>
                )}

                {/* Characters */}
                {characters.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-500
                                   uppercase tracking-wider mb-3
                                   flex items-center gap-2">
                      <Users size={14} className="text-amber-400" />
                      Участники дела ({characters.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {characters.map((char) => (
                        <div
                          key={char.slug}
                          className="flex items-center gap-2.5 p-2.5
                                     bg-neutral-800/50 rounded-lg
                                     border border-neutral-700/30"
                        >
                          {/* Avatar */}
                          <div className="flex-shrink-0 relative">
                            {char.avatar ? (
                              <img
                                src={getImageUrl(char.avatar)}
                                alt={char.name}
                                className="w-9 h-9 rounded-full
                                           object-cover
                                           border border-neutral-600/50"
                                onError={(e) => {
                                  (e.target as HTMLImageElement)
                                    .style.display = 'none';
                                  (e.target as HTMLImageElement)
                                    .nextElementSibling
                                    ?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-9 h-9 rounded-full
                                          flex items-center justify-center
                                          text-xs font-bold
                                          border border-neutral-600/50
                                          ${char.avatar ? 'hidden' : ''}`}
                              style={{
                                backgroundColor: '#2a2a3a',
                                color: '#c9a84c',
                              }}
                            >
                              {getInitials(char.name)}
                            </div>
                            {/* Lock indicator */}
                            {char.is_locked && (
                              <div className="absolute -bottom-0.5 -right-0.5
                                              w-3 h-3 bg-neutral-700
                                              rounded-full border
                                              border-neutral-800
                                              flex items-center
                                              justify-center">
                                <span className="text-[7px]
                                                 text-gray-500">🔒</span>
                              </div>
                            )}
                          </div>

                          {/* Name + role */}
                          <div className="min-w-0">
                            <p className="text-xs text-neutral-200
                                          font-medium truncate">
                              {char.name}
                            </p>
                            <p className="text-[10px] text-neutral-500
                                          truncate">
                              {char.occupation
                               || ROLE_LABELS[char.role || '']
                               || char.role}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Investigation phases */}
                {phases.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-500
                                   uppercase tracking-wider mb-3">
                      Этапы расследования
                    </h3>
                    <div className="space-y-2">
                      {phases.map((phase, i) => (
                        <div
                          key={phase.id}
                          className="flex gap-3 items-start"
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex
                                        items-center justify-center
                                        text-xs shrink-0 mt-0.5
                              ${phase.is_completed
                                ? 'bg-green-900/30 border border-green-700/40 text-green-400'
                                : phase.is_current
                                ? 'bg-amber-900/30 border border-amber-700/40 text-amber-400'
                                : 'bg-neutral-800 border border-neutral-700/40 text-neutral-500'
                              }`}
                          >
                            {phase.is_completed ? '✓' : i + 1}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${
                              phase.is_completed
                                ? 'text-green-400/80'
                                : phase.is_current
                                ? 'text-amber-300'
                                : 'text-neutral-400'
                            }`}>
                              {phase.name}
                            </p>
                            {phase.description && (
                              <p className="text-neutral-500 text-xs mt-0.5">
                                {phase.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Close button */}
                <div className="pt-3 border-t border-neutral-800">
                  <button
                    onClick={onClose}
                    className="px-5 py-2 text-sm text-neutral-400
                               border border-neutral-700 rounded-lg
                               hover:bg-neutral-800 transition-colors"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

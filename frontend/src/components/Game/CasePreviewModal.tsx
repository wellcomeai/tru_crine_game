import { X, Star, Clock, ChevronRight, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../../utils/helpers';
import type { Case } from '../../types';

interface CasePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: {
    id: string;
    title: string;
    description: string | null;
    difficulty: string;
    cover_image?: string | null;
    phases?: Array<{
      id: string;
      name: string;
      description: string;
    }>;
  } | null;
  caseItem?: Case | null;
  onStart: (caseId: string) => void;
  onBuy?: (caseId: string) => void;
  loading?: boolean;
  sessionStatus?: string | null;
  buyingCaseId?: string | null;
}

const DIFFICULTY_META: Record<string, { text: string; stars: number; time: string }> = {
  easy: { text: 'Легкое', stars: 1, time: '~30 мин' },
  medium: { text: 'Среднее', stars: 2, time: '~45 мин' },
  hard: { text: 'Сложное', stars: 3, time: '~60 мин' },
};

export default function CasePreviewModal({ isOpen, onClose, caseData, caseItem, onStart, onBuy, loading, sessionStatus, buyingCaseId }: CasePreviewModalProps) {
  if (!caseData) return null;

  const meta = DIFFICULTY_META[caseData.difficulty] || DIFFICULTY_META.medium;
  const needsPurchase = caseItem && !caseItem.is_free && !caseItem.is_purchased;
  const isBuying = buyingCaseId === caseData.id;

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
              className="bg-neutral-900 rounded-xl border border-neutral-700/50 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cover */}
              <div className="relative h-48 sm:h-56 overflow-hidden rounded-t-xl">
                {caseData.cover_image ? (
                  <img
                    src={getImageUrl(caseData.cover_image)}
                    alt={caseData.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent" />

                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 p-1.5 bg-black/50 rounded-full text-neutral-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5">
                <h2
                  className="text-2xl font-bold text-amber-300 mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {caseData.title}
                </h2>

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-neutral-400 mb-4">
                  <span className="flex items-center gap-1">
                    {Array.from({ length: meta.stars }).map((_, i) => (
                      <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                    ))}
                    <span className="ml-1">{meta.text}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {meta.time}
                  </span>
                  {caseItem && !caseItem.is_free && (
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      {caseItem.price} руб.
                    </span>
                  )}
                </div>

                {/* Description */}
                {caseData.description && (
                  <p className="text-neutral-300 leading-relaxed mb-6">{caseData.description}</p>
                )}

                {/* Phases */}
                {caseData.phases && caseData.phases.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                      Этапы расследования
                    </h3>
                    <div className="space-y-3">
                      {caseData.phases.map((phase, i) => (
                        <div key={phase.id} className="flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-full bg-amber-900/30 border border-amber-700/40 flex items-center justify-center text-xs text-amber-400 shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-neutral-200 text-sm font-medium">{phase.name}</p>
                            {phase.description && (
                              <p className="text-neutral-500 text-xs mt-0.5">{phase.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-neutral-800">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 text-sm text-neutral-400 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    Закрыть
                  </button>
                  {needsPurchase && onBuy ? (
                    <button
                      onClick={() => onBuy(caseData.id)}
                      disabled={isBuying}
                      className="flex-1 px-5 py-2.5 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isBuying ? (
                        'Переход к оплате...'
                      ) : (
                        <>
                          <ShoppingCart size={16} />
                          Купить за {caseItem!.price} руб.
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => onStart(caseData.id)}
                      disabled={loading}
                      className="flex-1 px-5 py-2.5 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        'Загрузка...'
                      ) : sessionStatus === 'active' ? (
                        <>
                          Продолжить расследование <ChevronRight size={16} />
                        </>
                      ) : sessionStatus === 'completed' ? (
                        <>
                          Начать заново <ChevronRight size={16} />
                        </>
                      ) : (
                        <>
                          Начать расследование <ChevronRight size={16} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

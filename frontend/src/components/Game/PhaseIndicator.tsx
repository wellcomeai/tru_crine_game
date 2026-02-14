import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { CheckCircle, Circle, Lock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PhaseIndicator() {
  const { phases } = useGameStore();
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-wrap px-4 py-2">
      {phases.map((phase, i) => (
        <div key={phase.id} className="flex items-center gap-1 sm:gap-2">
          {/* Phase badge */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredPhase(phase.id)}
            onMouseLeave={() => setHoveredPhase(null)}
          >
            <div
              className={`
                flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5
                rounded-full text-[11px] sm:text-xs font-medium
                cursor-default transition-all duration-200
                ${phase.is_completed
                  ? 'bg-green-900/30 text-green-400 border border-green-700/40'
                  : phase.is_current
                  ? 'bg-amber-900/25 text-amber-300 border border-amber-600/40 shadow-sm shadow-amber-500/10'
                  : phase.is_locked
                  ? 'bg-neutral-800/40 text-neutral-600 border border-neutral-700/30'
                  : 'bg-neutral-800/50 text-neutral-400 border border-neutral-700/40'
                }
              `}
            >
              {phase.is_completed ? (
                <CheckCircle size={12} className="shrink-0" />
              ) : phase.is_locked ? (
                <Lock size={11} className="shrink-0" />
              ) : (
                <Circle size={12} className="shrink-0" />
              )}
              <span className="hidden sm:inline">{phase.name}</span>
              <span className="sm:hidden">{phase.name.split(' ')[0]}</span>
            </div>

            {/* Tooltip on hover */}
            <AnimatePresence>
              {hoveredPhase === phase.id && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50 pointer-events-none"
                >
                  <div className="relative bg-neutral-800 text-neutral-300 text-xs px-4 py-3 rounded-lg shadow-2xl shadow-black/40 border border-neutral-700/60 min-w-[220px] max-w-[300px]">
                    {/* Arrow */}
                    <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-neutral-800 border-l border-t border-neutral-700/60 rotate-45" />

                    {/* Title */}
                    <p className="font-semibold text-amber-300 text-sm mb-1.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {phase.name}
                    </p>

                    {/* Description */}
                    {phase.description && (
                      <p className="text-neutral-400 leading-relaxed mb-2">
                        {phase.description}
                      </p>
                    )}

                    {/* Status */}
                    <div className="pt-2 border-t border-neutral-700/50">
                      {phase.is_completed ? (
                        <span className="text-green-400 flex items-center gap-1.5 text-[11px]">
                          <CheckCircle size={11} />
                          Фаза завершена
                        </span>
                      ) : phase.is_locked ? (
                        <span className="text-neutral-600 flex items-center gap-1.5 text-[11px]">
                          <Lock size={11} />
                          Сначала завершите предыдущую фазу
                        </span>
                      ) : phase.is_current ? (
                        <span className="text-amber-400 flex items-center gap-1.5 text-[11px]">
                          <Circle size={11} />
                          Текущая фаза — в процессе
                        </span>
                      ) : (
                        <span className="text-neutral-500 flex items-center gap-1.5 text-[11px]">
                          <Circle size={11} />
                          Ожидает выполнения
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Separator between phases */}
          {i < phases.length - 1 && (
            <ChevronRight size={14} className="text-neutral-600 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

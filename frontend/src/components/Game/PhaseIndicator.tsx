import { useGameStore } from '../../stores/gameStore';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

export default function PhaseIndicator() {
  const { phases } = useGameStore();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {phases.map((phase, i) => (
        <div key={phase.id} className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${
              phase.is_current
                ? 'bg-gold/20 text-gold border border-gold/40'
                : phase.is_completed
                ? 'bg-green-900/30 text-green-400 border border-green-600/30'
                : 'bg-noir-700 text-gray-500 border border-noir-600'
            }`}
          >
            {phase.is_completed ? (
              <CheckCircle size={12} />
            ) : (
              <Circle size={12} />
            )}
            {phase.name}
          </div>
          {i < phases.length - 1 && (
            <ArrowRight size={14} className="text-noir-500" />
          )}
        </div>
      ))}
    </div>
  );
}

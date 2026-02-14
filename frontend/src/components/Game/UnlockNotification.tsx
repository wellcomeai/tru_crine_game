import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Users, Search, Zap, X } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';

const typeIcons = {
  location: MapPin,
  character: Users,
  evidence: Search,
  phase: Zap,
};

const typeColors = {
  location: 'border-blue-500/50 bg-blue-900/30',
  character: 'border-green-500/50 bg-green-900/30',
  evidence: 'border-gold/50 bg-gold/10',
  phase: 'border-purple-500/50 bg-purple-900/30',
};

export default function UnlockNotification() {
  const { notifications, dismissNotification } = useGameStore();

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => {
          const Icon = typeIcons[notif.type] || Search;
          const colorClass = typeColors[notif.type] || typeColors.evidence;

          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border ${colorClass} shadow-lg`}
            >
              <Icon size={18} className="text-gold" />
              <div>
                <div className="text-sm font-semibold text-gray-200">{notif.title}</div>
                <div className="text-xs text-gray-400">{notif.description}</div>
              </div>
              <button
                onClick={() => dismissNotification(notif.id)}
                className="text-gray-500 hover:text-gray-300 ml-2"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

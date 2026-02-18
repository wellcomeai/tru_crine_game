import { motion, AnimatePresence } from 'framer-motion';
import { EMOTION_COLORS } from '../../utils/constants';

const EMOTION_LABELS: Record<string, string> = {
  calm: 'Спокоен',
  nervous: 'Нервничает',
  scared: 'Испуган',
  anxious: 'Тревожен',
  angry: 'Разгневан',
  panicked: 'В панике',
  terrified: 'В ужасе',
  talkative: 'Разговорчив',
  helpful: 'Помогает',
  surprised: 'Удивлён',
};

interface EmotionBadgeProps {
  emotion: string;
  compact?: boolean;
}

export default function EmotionBadge({ emotion, compact }: EmotionBadgeProps) {
  const color = EMOTION_COLORS[emotion] || EMOTION_COLORS.calm;
  const label = EMOTION_LABELS[emotion] || emotion;

  if (compact) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={emotion}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-1.5 px-2 py-1"
        >
          <motion.span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
            animate={{
              boxShadow: [
                `0 0 4px ${color}`,
                `0 0 10px ${color}`,
                `0 0 4px ${color}`,
              ],
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <span className="text-[11px] font-medium whitespace-nowrap" style={{ color }}>
            {label}
          </span>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={emotion}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(15, 15, 20, 0.7)',
          borderColor: `${color}40`,
        }}
      >
        <motion.span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            boxShadow: [
              `0 0 4px ${color}`,
              `0 0 10px ${color}`,
              `0 0 4px ${color}`,
            ],
          }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

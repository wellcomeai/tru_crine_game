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
}

export default function EmotionBadge({ emotion }: EmotionBadgeProps) {
  const color = EMOTION_COLORS[emotion] || EMOTION_COLORS.calm;
  const label = EMOTION_LABELS[emotion] || emotion;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={emotion}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md"
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

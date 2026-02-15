import { motion } from 'framer-motion';
import { ROLE_LABELS } from '../../utils/constants';

interface CharacterReplyProps {
  characterName: string;
  role: string | null;
  text: string;
  isStreaming: boolean;
}

export default function CharacterReply({
  characterName,
  role,
  text,
  isStreaming,
}: CharacterReplyProps) {
  if (!text && !isStreaming) return null;

  const roleLabel = ROLE_LABELS[role || ''] || role || 'Свидетель';

  return (
    <div className="absolute top-10 left-4 z-20 max-w-[55%] md:max-w-[45%]">
      {/* Role badge */}
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold/80 px-2 py-0.5 rounded border border-gold/20 bg-noir-900/60 backdrop-blur-sm">
          {roleLabel}
        </span>
        <span className="text-[10px] text-gray-500 font-medium">
          {characterName}
        </span>
      </div>

      {/* Reply bubble */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-lg border border-gray-600/30 backdrop-blur-md px-4 py-3"
        style={{
          backgroundColor: 'rgba(15, 15, 20, 0.75)',
        }}
      >
        <p className="text-sm leading-relaxed text-gray-200 whitespace-pre-wrap">
          {text}
          {isStreaming && (
            <span className="inline-block w-[2px] h-4 ml-0.5 bg-gold animate-pulse align-text-bottom" />
          )}
        </p>
      </motion.div>
    </div>
  );
}

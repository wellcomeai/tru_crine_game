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
    <div className="absolute top-12 right-4 bottom-14 w-[45%] sm:w-[35%] z-20
                    flex flex-col justify-center pointer-events-none">
      {/* Role badge */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em]
                         text-gold/80 px-2 py-0.5 rounded
                         border border-gold/20 bg-noir-900/40 backdrop-blur-sm">
          {roleLabel}
        </span>
      </div>

      {/* Character name */}
      <span className="text-[11px] text-gray-500 font-medium mb-2">
        {characterName}
      </span>

      {/* Reply text block */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-black/35 backdrop-blur-sm rounded-lg px-5 py-4
                   border border-white/5 max-h-[55%] overflow-y-auto
                   scrollbar-thin pointer-events-auto
                   shadow-lg shadow-black/20"
      >
        <p className="text-sm leading-relaxed text-gray-200 whitespace-pre-wrap">
          {text}
          {isStreaming && (
            <span className="inline-block w-[2px] h-4 ml-0.5
                             bg-gold animate-pulse align-text-bottom" />
          )}
        </p>
      </motion.div>
    </div>
  );
}

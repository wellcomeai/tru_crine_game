import { motion } from 'framer-motion';
import { Lock, MessageCircle } from 'lucide-react';
import type { Character } from '../../types';
import { getInitials, getImageUrl } from '../../utils/helpers';
import { ROLE_LABELS, EMOTION_COLORS } from '../../utils/constants';

interface CharacterCardProps {
  character: Character;
  onClick: () => void;
}

export default function CharacterCard({ character, onClick }: CharacterCardProps) {
  const emotionColor = EMOTION_COLORS[character.current_emotion] || EMOTION_COLORS.calm;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={character.is_locked ? {} : { scale: 1.02 }}
      onClick={character.is_locked ? undefined : onClick}
      className={`relative rounded-xl overflow-hidden border transition-all ${
        character.is_locked
          ? 'border-noir-600 opacity-50 cursor-not-allowed'
          : 'border-noir-500 cursor-pointer hover:border-gold-dim'
      }`}
    >
      <div className="p-4 bg-noir-800 flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          {character.avatar ? (
            <img
              src={getImageUrl(character.avatar)}
              alt={character.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-noir-600"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border-2 border-noir-600 ${
              character.avatar ? 'hidden' : ''
            }`}
            style={{ backgroundColor: '#2a2a3a', color: '#c9a84c' }}
          >
            {getInitials(character.name)}
          </div>

          {/* Emotion indicator */}
          <div
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-noir-800"
            style={{ backgroundColor: emotionColor }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-bold text-gray-200 truncate">{character.name}</h3>
          <p className="text-sm text-gray-500">
            {character.occupation || ROLE_LABELS[character.role || ''] || character.role}
          </p>
        </div>

        {/* Status */}
        <div className="flex-shrink-0">
          {character.is_locked ? (
            <Lock size={18} className="text-gray-600" />
          ) : character.is_interrogated ? (
            <MessageCircle size={18} className="text-gold-dim" />
          ) : (
            <span className="text-xs text-gold bg-gold/10 px-2 py-1 rounded-full">
              Новый
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

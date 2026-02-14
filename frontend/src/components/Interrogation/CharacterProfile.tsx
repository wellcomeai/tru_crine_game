import type { Character } from '../../types';
import { getInitials, getImageUrl } from '../../utils/helpers';
import { ROLE_LABELS, EMOTION_COLORS } from '../../utils/constants';

interface CharacterProfileProps {
  character: Character;
  emotion: string;
}

export default function CharacterProfile({ character, emotion }: CharacterProfileProps) {
  const emotionColor = EMOTION_COLORS[emotion] || EMOTION_COLORS.calm;

  return (
    <div className="bg-noir-800 border border-noir-600 rounded-xl p-4 space-y-4">
      {/* Avatar */}
      <div className="flex flex-col items-center">
        <div className="relative">
          {character.avatar ? (
            <img
              src={getImageUrl(character.avatar)}
              alt={character.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-noir-600"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-noir-600 ${
              character.avatar ? 'hidden' : ''
            }`}
            style={{ backgroundColor: '#2a2a3a', color: '#c9a84c' }}
          >
            {getInitials(character.name)}
          </div>
          <div
            className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-noir-800"
            style={{ backgroundColor: emotionColor }}
          />
        </div>
        <h3 className="font-serif font-bold text-gray-200 mt-3">{character.name}</h3>
        <p className="text-sm text-gray-500">
          {character.occupation || ROLE_LABELS[character.role || ''] || 'Свидетель'}
        </p>
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm">
        {character.age && (
          <div className="flex justify-between">
            <span className="text-gray-500">Возраст</span>
            <span className="text-gray-300">{character.age}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Роль</span>
          <span className="text-gray-300">{ROLE_LABELS[character.role || ''] || character.role}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Состояние</span>
          <span style={{ color: emotionColor }} className="capitalize">{emotion}</span>
        </div>
      </div>
    </div>
  );
}

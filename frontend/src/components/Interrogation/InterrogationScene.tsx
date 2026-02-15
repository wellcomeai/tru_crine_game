import { useMemo } from 'react';
import SceneHeader from './SceneHeader';
import CharacterReply from './CharacterReply';
import EmotionBadge from './EmotionBadge';
import { getImageUrl } from '../../utils/helpers';
import type { Character, ChatMessage } from '../../types';

interface InterrogationSceneProps {
  character: Character;
  emotion: string;
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
}

export default function InterrogationScene({
  character,
  emotion,
  messages,
  streamingText,
  isStreaming,
}: InterrogationSceneProps) {
  const imageUrl = character.interrogation_image
    ? getImageUrl(character.interrogation_image)
    : null;

  // Show only the last assistant reply (or streaming text)
  const lastReplyText = useMemo(() => {
    if (isStreaming && streamingText) return streamingText;
    // Find the last assistant message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return messages[i].content;
      }
    }
    return '';
  }, [messages, streamingText, isStreaming]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background image or fallback — fills entire space */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Допрос: ${character.name}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-noir-900 via-noir-800 to-noir-900">
          <div className="absolute top-1/4 left-[35%] -translate-x-1/2 w-32 h-32 rounded-full bg-yellow-900/10 blur-3xl" />
          <div className="absolute top-[40%] left-[35%] -translate-x-1/2 w-1 h-24 bg-gradient-to-b from-yellow-700/30 to-transparent" />
        </div>
      )}

      {/* Gradient: darken RIGHT side for text readability */}
      <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/40 to-transparent z-10 pointer-events-none" />

      {/* Bottom gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-noir-900/60 via-transparent to-black/20 z-10 pointer-events-none" />

      {/* Scene header: time, ДОПРОС, REC */}
      <SceneHeader characterName={character.name} />

      {/* Character reply — RIGHT PANEL */}
      <CharacterReply
        characterName={character.name}
        role={character.role}
        text={lastReplyText}
        isStreaming={isStreaming && !!streamingText}
      />

      {/* Emotion badge */}
      <EmotionBadge emotion={emotion} />

      {/* Typing indicator (when streaming but no text yet) */}
      {isStreaming && !streamingText && (
        <div className="absolute top-12 right-[5%] z-20">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md border border-gray-600/30"
               style={{ backgroundColor: 'rgba(15, 15, 20, 0.75)' }}>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-gray-500">Думает...</span>
          </div>
        </div>
      )}
    </div>
  );
}

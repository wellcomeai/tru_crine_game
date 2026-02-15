import { useMemo } from 'react';
import SceneHeader from './SceneHeader';
import CharacterReply from './CharacterReply';
import EmotionBadge from './EmotionBadge';
import { getImageUrl } from '../../utils/helpers';
import { EMOTION_COLORS } from '../../utils/constants';
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

  // Glow based on emotion intensity
  const glowStyle = useMemo(() => {
    const glowMap: Record<string, string> = {
      calm: 'none',
      nervous: '0 0 30px rgba(234, 179, 8, 0.08)',
      anxious: '0 0 30px rgba(234, 179, 8, 0.1)',
      scared: '0 0 40px rgba(249, 115, 22, 0.12)',
      angry: '0 0 40px rgba(239, 68, 68, 0.12)',
      panicked: '0 0 50px rgba(239, 68, 68, 0.18)',
      terrified: '0 0 60px rgba(239, 68, 68, 0.22)',
    };
    return glowMap[emotion] || 'none';
  }, [emotion]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-t-xl border border-noir-600/50 border-b-0"
      style={{
        height: 'clamp(280px, 55vh, 500px)',
        boxShadow: glowStyle,
        transition: 'box-shadow 0.6s ease',
      }}
    >
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gold/20 z-30 rounded-tl-xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gold/20 z-30 rounded-tr-xl pointer-events-none" />

      {/* Background image or fallback */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Допрос: ${character.name}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-noir-900 via-noir-800 to-noir-900">
          {/* CSS fallback: silhouette + lamp effect */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-yellow-900/10 blur-3xl" />
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-1 h-24 bg-gradient-to-b from-yellow-700/30 to-transparent" />
        </div>
      )}

      {/* Gradient overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-noir-900 via-transparent to-black/30 z-10 pointer-events-none" />

      {/* Scene header */}
      <SceneHeader characterName={character.name} />

      {/* Character reply overlay */}
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
        <div className="absolute top-12 left-4 z-20">
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

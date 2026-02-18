import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import GameLayout from '../components/Layout/GameLayout';
import InterrogationScene from '../components/Interrogation/InterrogationScene';
import DialogueLog from '../components/Interrogation/DialogueLog';
import ChatInput from '../components/Interrogation/ChatInput';
import EvidenceSelector from '../components/Interrogation/EvidenceSelector';
import EmotionBadge from '../components/Interrogation/EmotionBadge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { useInterrogation } from '../hooks/useInterrogation';
import { useGameStore } from '../stores/gameStore';
import { useMobile } from '../hooks/useMobile';
import { getImageUrl } from '../utils/helpers';
import { ROLE_LABELS } from '../utils/constants';
import { useMemo } from 'react';

export default function InterrogationPage() {
  const { sessionId, characterSlug } = useParams<{
    sessionId: string;
    characterSlug: string;
  }>();
  const navigate = useNavigate();
  const { characters, loadCharacters, loadEvidence } = useGameStore();
  const [showEvSelector, setShowEvSelector] = useState(false);
  const { isMobile } = useMobile();

  const character = characters.find((c) => c.slug === characterSlug);

  const {
    messages,
    sendMessage,
    showEvidence,
    isStreaming,
    streamingText,
    currentEmotion,
    initInterrogation,
    loadHistory,
    initialized,
  } = useInterrogation(sessionId!, characterSlug!);

  useEffect(() => {
    if (!character) {
      loadCharacters();
    }
    loadEvidence();
  }, []);

  useEffect(() => {
    if (character && !initialized) {
      loadHistory().then(() => {
        initInterrogation();
      });
    }
  }, [character, initialized]);

  // Last reply text for mobile chat view
  const lastReplyText = useMemo(() => {
    if (isStreaming && streamingText) return streamingText;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return messages[i].content;
      }
    }
    return '';
  }, [messages, streamingText, isStreaming]);

  if (!character) {
    return (
      <GameLayout>
        <LoadingSpinner size={48} />
      </GameLayout>
    );
  }

  const roleLabel = ROLE_LABELS[character.role || ''] || character.role || 'Свидетель';
  const imageUrl = character.interrogation_image
    ? getImageUrl(character.interrogation_image)
    : null;

  // ─── Mobile layout ───
  if (isMobile) {
    return (
      <GameLayout noPadding>
        <div className="flex flex-col h-[calc(100dvh-3rem)]">
          {/* Compact header */}
          <div className="flex items-center gap-2 px-3 py-2 bg-noir-800/90 border-b border-noir-600/30 flex-shrink-0 z-30">
            <button
              onClick={() => navigate(`/game/${sessionId}`)}
              className="text-gray-400 active:text-gray-200 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{character.name}</p>
              <p className="text-[10px] text-gray-500">{roleLabel}</p>
            </div>
            <EmotionBadge emotion={currentEmotion} compact />
          </div>

          {/* Character image — fixed height */}
          <div className="relative flex-shrink-0" style={{ height: '35vh' }}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`Допрос: ${character.name}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-noir-900 via-noir-800 to-noir-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-noir-900/80 via-transparent to-black/20 pointer-events-none" />
          </div>

          {/* Chat area — scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <DialogueLog
              messages={messages}
              characterName={character.name}
            />

            {/* Last reply as chat bubble */}
            {lastReplyText && (
              <div className="px-3 py-3">
                <div className="bg-noir-800/60 border border-noir-600/30 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">{character.name}</p>
                  <p className="text-sm leading-relaxed text-gray-200 whitespace-pre-wrap">
                    {lastReplyText}
                    {isStreaming && (
                      <span className="inline-block w-[2px] h-4 ml-0.5
                                       bg-gold animate-pulse align-text-bottom" />
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isStreaming && !streamingText && (
              <div className="px-3 py-2">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-noir-800/60 border border-noir-600/30">
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

          {/* Input — sticky bottom */}
          <div className="flex-shrink-0 bg-noir-900 border-t border-noir-700/30"
               style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <ChatInput
              onSend={sendMessage}
              onShowEvidence={() => setShowEvSelector(true)}
              disabled={isStreaming}
            />
          </div>
        </div>

        <EvidenceSelector
          isOpen={showEvSelector}
          onClose={() => setShowEvSelector(false)}
          onSelect={(slug, name) => showEvidence(slug, name)}
        />
      </GameLayout>
    );
  }

  // ─── Desktop layout (original) ───
  return (
    <GameLayout noPadding>
      <div className="flex flex-col h-[calc(100dvh-3.5rem)]">
        {/* Back button — overlay on scene */}
        <button
          onClick={() => navigate(`/game/${sessionId}`)}
          className="absolute top-10 z-40
                     left-4 lg:left-4
                     flex items-center gap-1.5
                     text-gray-400 hover:text-gray-200 transition-colors
                     bg-noir-900/50 backdrop-blur-sm
                     rounded-lg px-3 py-1.5
                     border border-noir-600/30
                     hover:border-noir-500/50
                     hover:bg-noir-900/70"
        >
          <ArrowLeft size={16} />
          <span className="text-xs">Назад</span>
        </button>

        {/* Scene — fills ALL available space */}
        <div className="flex-1 relative min-h-0">
          <InterrogationScene
            character={character}
            emotion={currentEmotion}
            messages={messages}
            streamingText={streamingText}
            isStreaming={isStreaming}
          />
        </div>

        {/* Bottom panel: protocol + input */}
        <div className="flex-shrink-0 bg-noir-900 border-t border-noir-600/50">
          <DialogueLog
            messages={messages}
            characterName={character.name}
          />
          <ChatInput
            onSend={sendMessage}
            onShowEvidence={() => setShowEvSelector(true)}
            disabled={isStreaming}
          />
        </div>
      </div>

      <EvidenceSelector
        isOpen={showEvSelector}
        onClose={() => setShowEvSelector(false)}
        onSelect={(slug, name) => showEvidence(slug, name)}
      />
    </GameLayout>
  );
}

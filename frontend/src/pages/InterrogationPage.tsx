import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import GameLayout from '../components/Layout/GameLayout';
import InterrogationScene from '../components/Interrogation/InterrogationScene';
import DialogueLog from '../components/Interrogation/DialogueLog';
import ChatInput from '../components/Interrogation/ChatInput';
import EvidenceSelector from '../components/Interrogation/EvidenceSelector';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { useInterrogation } from '../hooks/useInterrogation';
import { useGameStore } from '../stores/gameStore';

export default function InterrogationPage() {
  const { sessionId, characterSlug } = useParams<{
    sessionId: string;
    characterSlug: string;
  }>();
  const navigate = useNavigate();
  const { characters, loadCharacters, loadEvidence } = useGameStore();
  const [showEvSelector, setShowEvSelector] = useState(false);

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

  if (!character) {
    return (
      <GameLayout>
        <LoadingSpinner size={48} />
      </GameLayout>
    );
  }

  return (
    <GameLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] max-w-5xl mx-auto">
        {/* Back button - floating */}
        <button
          onClick={() => navigate(`/game/${sessionId}`)}
          className="absolute top-4 left-4 z-40 flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition-colors bg-noir-900/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-noir-600/50"
        >
          <ArrowLeft size={16} />
          <span className="text-xs hidden sm:inline">Назад</span>
        </button>

        {/* Decorative frame wrapper */}
        <div className="flex-1 flex flex-col min-h-0 rounded-xl overflow-hidden border border-gold/10 bg-noir-900">
          {/* Scene area — fills upper portion */}
          <div className="flex-shrink-0">
            <InterrogationScene
              character={character}
              emotion={currentEmotion}
              messages={messages}
              streamingText={streamingText}
              isStreaming={isStreaming}
            />
          </div>

          {/* Bottom panel: log + input */}
          <div className="flex flex-col bg-noir-900 border-t border-noir-600/50 rounded-b-xl">
            {/* Dialogue log (collapsible) */}
            <DialogueLog
              messages={messages}
              characterName={character.name}
            />

            {/* Input area */}
            <ChatInput
              onSend={sendMessage}
              onShowEvidence={() => setShowEvSelector(true)}
              disabled={isStreaming}
            />
          </div>

          {/* Corner decorations at bottom */}
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gold/10 z-30 rounded-bl-xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gold/10 z-30 rounded-br-xl pointer-events-none" />
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

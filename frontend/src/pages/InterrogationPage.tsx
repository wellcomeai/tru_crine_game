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
    <GameLayout noPadding>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Back button — overlay on scene, positioned after sidebar */}
        <button
          onClick={() => navigate(`/game/${sessionId}`)}
          className="absolute top-[4.5rem] left-[4.5rem] lg:left-[13rem] z-40 flex items-center gap-1.5
                     text-gray-400 hover:text-gray-200 transition-colors
                     bg-noir-900/60 backdrop-blur-sm rounded-lg px-3 py-1.5
                     border border-noir-600/30"
        >
          <ArrowLeft size={16} />
          <span className="text-xs hidden sm:inline">Назад</span>
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

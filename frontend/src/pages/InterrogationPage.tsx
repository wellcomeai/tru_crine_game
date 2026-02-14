import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import GameLayout from '../components/Layout/GameLayout';
import ChatMessageComponent from '../components/Interrogation/ChatMessage';
import ChatInput from '../components/Interrogation/ChatInput';
import CharacterProfile from '../components/Interrogation/CharacterProfile';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  if (!character) {
    return (
      <GameLayout>
        <LoadingSpinner size={48} />
      </GameLayout>
    );
  }

  return (
    <GameLayout>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Character profile - sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <CharacterProfile character={character} emotion={currentEmotion} />
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-noir-800 rounded-xl border border-noir-600 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-noir-600">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/game/${sessionId}`)}
                className="text-gray-400 hover:text-gray-200"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <span className="font-serif font-bold text-gray-200">
                  Допрос: {character.name}
                </span>
                <span className="lg:hidden text-xs text-gray-500 ml-2">
                  {character.occupation}
                </span>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-200" title="Досье">
              <FileText size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {messages.map((msg, i) => (
              <ChatMessageComponent key={i} message={msg} />
            ))}

            {/* Streaming text */}
            {isStreaming && streamingText && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start mb-3"
              >
                <div className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-bl-sm bg-noir-700 text-gray-300 border border-noir-600">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {streamingText}
                    <span className="typewriter-cursor" />
                  </p>
                </div>
              </motion.div>
            )}

            {isStreaming && !streamingText && (
              <div className="flex justify-start mb-3">
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-noir-700 border border-noir-600">
                  <div className="flex gap-1">
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-gray-500 rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-gray-500 rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-gray-500 rounded-full" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
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

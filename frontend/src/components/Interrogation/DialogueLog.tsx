import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ChatMessage } from '../../types';

interface DialogueLogProps {
  messages: ChatMessage[];
  characterName: string;
}

export default function DialogueLog({ messages, characterName }: DialogueLogProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, isExpanded]);

  if (messages.length === 0) return null;

  return (
    <div className="border-t border-noir-600/50">
      {/* Toggle header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
      >
        <span>
          Лог допроса ({messages.length} {messages.length === 1 ? 'сообщение' : messages.length < 5 ? 'сообщения' : 'сообщений'})
        </span>
        {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {/* Log content */}
      {isExpanded && (
        <div
          ref={logRef}
          className="max-h-32 overflow-y-auto px-4 pb-2 space-y-1 scrollbar-thin"
        >
          {messages.map((msg, i) => {
            const isEvidence = msg.evidence_shown != null;
            const isUser = msg.role === 'user' && !isEvidence;
            const isAssistant = msg.role === 'assistant';

            if (isEvidence) {
              return (
                <div key={i} className="text-[11px] text-gold/70 italic">
                  {msg.content}
                </div>
              );
            }

            return (
              <div key={i} className="text-[11px] leading-snug">
                <span className={isUser ? 'text-gray-400 font-medium' : 'text-gray-500 font-medium'}>
                  {isUser ? 'Вы' : characterName}:
                </span>{' '}
                <span className={isAssistant ? 'text-gray-400' : 'text-gray-300'}>
                  {msg.content.length > 150
                    ? msg.content.slice(0, 150) + '...'
                    : msg.content}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

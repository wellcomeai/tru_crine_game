import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { formatTimestamp } from '../../utils/helpers';

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

  // Preview of last message for collapsed state
  const lastPreview = useMemo(() => {
    if (messages.length === 0) return '';
    const last = messages[messages.length - 1];
    const isUser = last.role === 'user' && !last.evidence_shown;
    const prefix = isUser ? 'Вы' : characterName;
    const text = last.content.length > 80
      ? last.content.slice(0, 80) + '...'
      : last.content;
    return `${prefix}: ${text}`;
  }, [messages, characterName]);

  if (messages.length === 0) return null;

  const msgCount = messages.length;
  const msgWord = msgCount === 1
    ? 'сообщение'
    : msgCount < 5
    ? 'сообщения'
    : 'сообщений';

  return (
    <div className="border-t border-noir-600/30 bg-noir-900/80">
      {/* Toggle header with preview */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-2
                   text-xs hover:bg-noir-800/50 transition-colors group"
      >
        {/* Title */}
        <span className="text-gray-500 font-medium whitespace-nowrap">
          Протокол допроса ({msgCount} {msgWord})
        </span>

        {/* Last message preview — only when collapsed */}
        {!isExpanded && lastPreview && (
          <>
            <span className="text-noir-500">│</span>
            <span className="text-gray-600 truncate text-[11px]">
              {lastPreview}
            </span>
          </>
        )}

        {/* Arrow */}
        <span className="ml-auto text-gray-600 group-hover:text-gray-400
                         transition-colors flex-shrink-0">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>

      {/* Expanded log */}
      {isExpanded && (
        <div
          ref={logRef}
          className="max-h-40 overflow-y-auto px-4 pb-3 space-y-1.5
                     scrollbar-thin"
        >
          {messages.map((msg, i) => {
            const isEvidence = msg.evidence_shown != null;
            const isUser = msg.role === 'user' && !isEvidence;
            const isAssistant = msg.role === 'assistant';
            const time = formatTimestamp(msg.timestamp);

            // System message — evidence presented
            if (isEvidence) {
              return (
                <div key={i} className="flex justify-center my-2">
                  <div className="inline-flex items-center gap-1.5
                                  bg-gold/8 border border-gold/15
                                  text-gold/70 text-[11px]
                                  px-3 py-1 rounded-full">
                    <span>🔍</span>
                    <span>{msg.content}</span>
                  </div>
                </div>
              );
            }

            // Player message
            if (isUser) {
              return (
                <div
                  key={i}
                  className="flex items-start gap-0 border-l-2
                             border-gold/40 bg-gold/5 rounded-r-md"
                >
                  <div className="flex-1 px-3 py-1.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-semibold text-gold/70">
                        Вы
                      </span>
                      <span className="text-[10px] text-gray-600">{time}</span>
                    </div>
                    <p className="text-[12px] text-gray-300 leading-snug">
                      {msg.content.length > 200
                        ? msg.content.slice(0, 200) + '...'
                        : msg.content}
                    </p>
                  </div>
                </div>
              );
            }

            // Character message
            if (isAssistant) {
              return (
                <div
                  key={i}
                  className="flex items-start gap-0 border-l-2
                             border-gray-600/20 bg-noir-700/20 rounded-r-md"
                >
                  <div className="flex-1 px-3 py-1.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-medium text-gray-500">
                        {characterName}
                      </span>
                      <span className="text-[10px] text-gray-600">{time}</span>
                    </div>
                    <p className="text-[12px] text-gray-400 leading-snug">
                      {msg.content.length > 200
                        ? msg.content.slice(0, 200) + '...'
                        : msg.content}
                    </p>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}

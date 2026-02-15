import { useState, KeyboardEvent } from 'react';
import { Send, FileSearch } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  onShowEvidence: () => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, onShowEvidence, disabled }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-noir-900
                    border-t border-noir-700/30">
      {/* Evidence button */}
      <div className="relative group">
        <button
          onClick={onShowEvidence}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-2
                     text-gray-500 hover:text-gold
                     bg-noir-800 hover:bg-noir-700
                     border border-noir-600/50 hover:border-gold/30
                     rounded-lg transition-all duration-200
                     disabled:opacity-30 disabled:cursor-not-allowed
                     disabled:hover:text-gray-500 disabled:hover:bg-noir-800
                     disabled:hover:border-noir-600/50"
        >
          <FileSearch size={16} />
          <span className="hidden lg:inline text-xs font-medium">
            Предъявить улику
          </span>
        </button>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                        opacity-0 group-hover:opacity-100
                        transition-opacity duration-200
                        pointer-events-none z-50 whitespace-nowrap">
          <div className="bg-noir-800 text-gray-300 text-[11px]
                          px-3 py-1.5 rounded-lg shadow-xl shadow-black/40
                          border border-noir-500">
            Предъявить улику подозреваемому
            {/* Arrow */}
            <div className="absolute -bottom-[4px] left-1/2 -translate-x-1/2
                            w-2 h-2 bg-noir-800 border-r border-b
                            border-noir-500 rotate-45" />
          </div>
        </div>
      </div>

      {/* Input field */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={
          disabled
            ? 'Ожидайте ответа...'
            : 'Задайте вопрос подозреваемому...'
        }
        className="flex-1 bg-noir-800 text-gray-200 rounded-lg
                   px-4 py-2.5
                   border border-noir-600/40
                   focus:border-gold/30 focus:outline-none
                   focus:shadow-[0_0_8px_rgba(201,168,76,0.12)]
                   text-sm placeholder-gray-600
                   transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {/* Send button */}
      <div className="relative group">
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="flex items-center justify-center
                     w-9 h-9 rounded-lg
                     bg-gold/10 hover:bg-gold/20
                     text-gold hover:text-gold-dim
                     border border-gold/15 hover:border-gold/30
                     transition-all duration-200
                     disabled:opacity-15 disabled:cursor-not-allowed
                     disabled:hover:bg-gold/10 disabled:hover:border-gold/15"
        >
          <Send size={16} />
        </button>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2
                        opacity-0 group-hover:opacity-100
                        transition-opacity duration-200
                        pointer-events-none z-50 whitespace-nowrap">
          <div className="bg-noir-800 text-gray-300 text-[11px]
                          px-3 py-1.5 rounded-lg shadow-xl shadow-black/40
                          border border-noir-500">
            Отправить (Enter)
            <div className="absolute -bottom-[4px] right-3
                            w-2 h-2 bg-noir-800 border-r border-b
                            border-noir-500 rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
}

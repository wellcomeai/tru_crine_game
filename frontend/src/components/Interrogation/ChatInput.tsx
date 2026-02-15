import { useState, KeyboardEvent } from 'react';
import { Send, Paperclip } from 'lucide-react';

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
    <div className="flex items-center gap-2 p-3 bg-noir-900 border-t border-noir-700/50">
      <button
        onClick={onShowEvidence}
        disabled={disabled}
        className="flex-shrink-0 text-gray-500 hover:text-gold transition-colors disabled:opacity-30 p-2 rounded-lg hover:bg-noir-800"
        title="Предъявить улику"
      >
        <Paperclip size={18} />
      </button>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={disabled ? 'Ожидайте ответа...' : 'Задайте вопрос подозреваемому...'}
        className="flex-1 bg-noir-800 text-gray-200 rounded-lg px-4 py-2.5 border border-noir-600/50 focus:border-gold/30 focus:outline-none text-sm placeholder-gray-600 transition-colors"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="flex-shrink-0 text-gold hover:text-gold-dim transition-colors disabled:opacity-20 p-2 rounded-lg hover:bg-noir-800"
      >
        <Send size={18} />
      </button>
    </div>
  );
}

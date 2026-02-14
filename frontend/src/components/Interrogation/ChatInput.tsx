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
    <div className="flex items-center gap-2 p-3 bg-noir-800 border-t border-noir-600">
      <button
        onClick={onShowEvidence}
        disabled={disabled}
        className="text-gray-400 hover:text-gold transition-colors disabled:opacity-50 p-2"
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
        placeholder={disabled ? 'Ожидайте ответа...' : 'Задайте вопрос...'}
        className="flex-1 bg-noir-700 text-gray-200 rounded-lg px-4 py-2 border border-noir-600 focus:border-gold-dim focus:outline-none text-sm placeholder-gray-600"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="text-gold hover:text-gold-dim transition-colors disabled:opacity-30 p-2"
      >
        <Send size={18} />
      </button>
    </div>
  );
}

import { motion } from 'framer-motion';
import type { ChatMessage as ChatMessageType } from '../../types';
import { formatTimestamp } from '../../utils/helpers';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.evidence_shown != null;

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center my-2"
      >
        <div className="bg-gold/10 text-gold text-xs px-3 py-1.5 rounded-full border border-gold/20">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
          isUser
            ? 'bg-gold/20 text-gray-200 rounded-br-sm border border-gold/20'
            : 'bg-noir-700 text-gray-300 rounded-bl-sm border border-noir-600'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <p className="text-xs text-gray-600 mt-1">{formatTimestamp(message.timestamp)}</p>
      </div>
    </motion.div>
  );
}

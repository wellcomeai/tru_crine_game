import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import GameLayout from '../components/Layout/GameLayout';
import BoardCanvas from '../components/Board/BoardCanvas';
import { useGame } from '../hooks/useGame';

export default function BoardPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  useGame(sessionId!);

  return (
    <GameLayout noPadding>
      <div className="relative h-[calc(100vh-3.5rem)]">
        {/* Back button — overlay */}
        <button
          onClick={() => navigate(`/game/${sessionId}`)}
          className="absolute top-3 left-3 z-40
                     flex items-center gap-1.5
                     text-gray-300 hover:text-white transition-colors
                     bg-[rgba(10,10,15,0.7)] backdrop-blur-sm
                     rounded-lg px-3 py-1.5
                     border border-noir-600/30
                     hover:border-gold-dim/50
                     hover:bg-[rgba(10,10,15,0.85)]"
        >
          <ArrowLeft size={16} />
          <span className="text-xs hidden sm:inline">Назад</span>
        </button>

        {/* Title — overlay */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40
                        bg-[rgba(10,10,15,0.7)] backdrop-blur-sm
                        rounded-lg px-4 py-1.5
                        border border-noir-600/30">
          <h2 className="font-serif text-sm sm:text-base text-gold whitespace-nowrap">
            Доска расследования
          </h2>
        </div>

        {/* Board canvas — edge to edge */}
        <BoardCanvas />
      </div>
    </GameLayout>
  );
}

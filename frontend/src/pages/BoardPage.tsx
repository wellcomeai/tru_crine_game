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
    <GameLayout>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(`/game/${sessionId}`)}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-serif text-xl text-gold">Доска расследования</h2>
        <p className="text-xs text-gray-500 ml-2">
          Перетаскивайте связи между уликами
        </p>
      </div>

      <div className="h-[calc(100vh-12rem)] bg-noir-800 rounded-xl border border-noir-600 overflow-hidden">
        <BoardCanvas />
      </div>
    </GameLayout>
  );
}

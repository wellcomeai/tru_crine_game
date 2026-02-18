import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutGrid, List } from 'lucide-react';
import GameLayout from '../components/Layout/GameLayout';
import BoardCanvas from '../components/Board/BoardCanvas';
import BoardListView from '../components/Board/BoardListView';
import { useGame } from '../hooks/useGame';
import { useMobile } from '../hooks/useMobile';

export default function BoardPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { isMobile } = useMobile();
  useGame(sessionId!);

  const [viewMode, setViewMode] = useState<'board' | 'list'>(isMobile ? 'list' : 'board');

  return (
    <GameLayout noPadding>
      <div className="relative h-[calc(100dvh-3rem)] lg:h-[calc(100dvh-3.5rem)]">
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
                     hover:bg-[rgba(10,10,15,0.85)]
                     min-w-[44px] min-h-[44px]
                     justify-center"
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

        {/* View toggle — mobile */}
        <div className="absolute top-3 right-3 z-40 flex gap-1
                        bg-[rgba(10,10,15,0.7)] backdrop-blur-sm
                        rounded-lg border border-noir-600/30 p-0.5 lg:hidden">
          <button
            onClick={() => setViewMode('board')}
            className={`p-2 rounded-md transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
              viewMode === 'board'
                ? 'bg-gold/20 text-gold'
                : 'text-gray-500 active:text-gray-300'
            }`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
              viewMode === 'list'
                ? 'bg-gold/20 text-gold'
                : 'text-gray-500 active:text-gray-300'
            }`}
          >
            <List size={16} />
          </button>
        </div>

        {/* Board or List view */}
        {viewMode === 'list' ? (
          <div className="h-full bg-noir-900 pt-14">
            <BoardListView />
          </div>
        ) : (
          <BoardCanvas />
        )}
      </div>
    </GameLayout>
  );
}

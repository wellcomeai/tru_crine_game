import { useGameStore } from '../../stores/gameStore';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function TopBar() {
  const { caseData, phases } = useGameStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const currentPhase = phases.find((p) => p.is_current);

  return (
    <div className="h-12 lg:h-14 bg-noir-800 border-b border-noir-600 flex items-center justify-between px-3 lg:px-4 flex-shrink-0">
      <div className="flex items-center gap-2 lg:gap-4 min-w-0">
        <h1
          className="font-serif text-gold font-bold cursor-pointer text-sm lg:text-base whitespace-nowrap"
          onClick={() => navigate('/cases')}
        >
          <span className="lg:hidden">D.AI</span>
          <span className="hidden lg:inline">DETECTIVE AI</span>
        </h1>
        {caseData && (
          <>
            <span className="text-noir-500 hidden sm:inline">|</span>
            <span className="text-gray-300 text-xs lg:text-sm truncate max-w-[140px] lg:max-w-none hidden sm:inline">
              {caseData.title}
            </span>
          </>
        )}
        {currentPhase && (
          <>
            <span className="text-noir-500 hidden lg:inline">|</span>
            <span className="text-gold-dim text-sm hidden lg:inline">{currentPhase.name}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
        <span className="text-gray-400 text-sm hidden sm:inline">{user?.username}</span>
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="text-gray-500 hover:text-gray-300 transition-colors hidden lg:block"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}

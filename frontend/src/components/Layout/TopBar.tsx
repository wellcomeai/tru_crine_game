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
    <div className="h-14 bg-noir-800 border-b border-noir-600 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1
          className="font-serif text-gold font-bold cursor-pointer"
          onClick={() => navigate('/cases')}
        >
          DETECTIVE AI
        </h1>
        {caseData && (
          <>
            <span className="text-noir-500">|</span>
            <span className="text-gray-300 text-sm">{caseData.title}</span>
          </>
        )}
        {currentPhase && (
          <>
            <span className="text-noir-500">|</span>
            <span className="text-gold-dim text-sm">{currentPhase.name}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-sm">{user?.username}</span>
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}

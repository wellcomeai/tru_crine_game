import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Users, Search, ClipboardList, Menu } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';
import MobileDrawer from './MobileDrawer';

const navItems = [
  { id: 'locations', icon: MapPin, label: 'Карта', tab: 'locations' as const },
  { id: 'characters', icon: Users, label: 'Допросы', tab: 'characters' as const },
  { id: 'evidence', icon: Search, label: 'Улики', tab: 'evidence' as const },
  { id: 'board', icon: ClipboardList, label: 'Доска', path: 'board' },
  { id: 'more', icon: Menu, label: 'Ещё' },
];

interface BottomNavProps {
  onAboutClick?: () => void;
}

export default function BottomNav({ onAboutClick }: BottomNavProps) {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { activeTab, setActiveTab, state } = useGameStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const evidenceCount = state?.collected_evidence?.length || 0;

  const handleTap = (item: typeof navItems[number]) => {
    if (item.id === 'more') {
      setDrawerOpen(true);
      return;
    }
    if ('path' in item && item.path) {
      navigate(`/game/${sessionId}/${item.path}`);
    } else if ('tab' in item && item.tab) {
      setActiveTab(item.tab);
      navigate(`/game/${sessionId}`);
    }
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden
                   bg-noir-800/90 backdrop-blur-lg
                   border-t border-noir-600"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = 'tab' in item && item.tab === activeTab;

            return (
              <button
                key={item.id}
                onClick={() => handleTap(item)}
                className={`flex flex-col items-center justify-center
                           w-full h-full min-w-[44px] min-h-[44px]
                           transition-colors relative
                           ${isActive ? 'text-gold' : 'text-gray-500 active:text-gray-300'}`}
              >
                <Icon size={22} />
                <span className="text-[10px] mt-0.5 leading-none">{item.label}</span>
                {item.id === 'evidence' && evidenceCount > 0 && (
                  <span className="absolute top-1 right-1/2 translate-x-3
                                   bg-gold text-noir-900 text-[9px] font-bold
                                   min-w-[16px] h-4 rounded-full
                                   flex items-center justify-center px-1">
                    {evidenceCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAboutClick={onAboutClick}
      />
    </>
  );
}

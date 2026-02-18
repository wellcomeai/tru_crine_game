import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';
import {
  MapPin, Users, Search, ClipboardList,
  BookOpen, Scale, FileText
} from 'lucide-react';

const menuItems = [
  { id: 'about', icon: FileText, label: 'О деле', action: 'modal' as const },
  { id: 'locations', icon: MapPin, label: 'Карта', tab: 'locations' as const },
  { id: 'characters', icon: Users, label: 'Допросы', tab: 'characters' as const },
  { id: 'evidence', icon: Search, label: 'Улики', tab: 'evidence' as const },
  { id: 'board', icon: ClipboardList, label: 'Доска', path: 'board' },
  { id: 'notebook', icon: BookOpen, label: 'Заметки', path: 'notebook' },
  { id: 'accuse', icon: Scale, label: 'Обвинить', path: 'accuse' },
];

interface SidebarProps {
  onAboutClick?: () => void;
}

export default function Sidebar({ onAboutClick }: SidebarProps) {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { activeTab, setActiveTab, state } = useGameStore();

  const evidenceCount = state?.collected_evidence?.length || 0;

  return (
    <div className="hidden lg:flex w-48 bg-noir-800 border-r border-noir-600
                    flex-col py-4">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = 'tab' in item && item.tab === activeTab;

        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'about' && onAboutClick) {
                onAboutClick();
              } else if ('path' in item && item.path) {
                navigate(`/game/${sessionId}/${item.path}`);
              } else if ('tab' in item && item.tab) {
                setActiveTab(item.tab);
                navigate(`/game/${sessionId}`);
              }
            }}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
              isActive
                ? 'bg-noir-700 text-gold border-r-2 border-gold'
                : 'text-gray-400 hover:text-gray-200 hover:bg-noir-700'
            }`}
          >
            <Icon size={20} />
            <span className="hidden lg:block text-sm">{item.label}</span>
            {item.id === 'evidence' && evidenceCount > 0 && (
              <span className="hidden lg:block ml-auto text-xs
                               bg-gold text-noir-900 rounded-full
                               px-1.5 py-0.5">
                {evidenceCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

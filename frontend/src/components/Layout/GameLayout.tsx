import { ReactNode } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import UnlockNotification from '../Game/UnlockNotification';
import CaseAboutModal from '../Game/CaseAboutModal';
import { useGameStore } from '../../stores/gameStore';

interface GameLayoutProps {
  children: ReactNode;
  noPadding?: boolean;
}

export default function GameLayout({ children, noPadding }: GameLayoutProps) {
  const {
    showAboutModal,
    setShowAboutModal,
    caseData,
    phases,
    characters,
  } = useGameStore();

  return (
    <div className="h-screen flex flex-col bg-noir-900">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onAboutClick={() => setShowAboutModal(true)} />
        <main className={`flex-1 overflow-y-auto ${noPadding ? '' : 'p-6'}`}>
          {children}
        </main>
      </div>
      <UnlockNotification />

      {/* "About case" modal — available on all pages */}
      <CaseAboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        caseData={caseData}
        phases={phases}
        characters={characters}
      />
    </div>
  );
}

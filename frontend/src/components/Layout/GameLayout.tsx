import { ReactNode } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
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
    <div className="h-[100dvh] flex flex-col bg-noir-900">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onAboutClick={() => setShowAboutModal(true)} />
        <main
          className={`flex-1 overflow-y-auto
            ${noPadding ? '' : 'p-4 lg:p-6'}
            ${noPadding ? '' : 'pb-[calc(56px+env(safe-area-inset-bottom,0px))] lg:pb-6'}`}
        >
          {children}
        </main>
      </div>
      <BottomNav onAboutClick={() => setShowAboutModal(true)} />
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

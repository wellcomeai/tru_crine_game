import { ReactNode } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import UnlockNotification from '../Game/UnlockNotification';

interface GameLayoutProps {
  children: ReactNode;
}

export default function GameLayout({ children }: GameLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-noir-900">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <UnlockNotification />
    </div>
  );
}

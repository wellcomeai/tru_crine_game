import { useEffect, useState } from 'react';

interface SceneHeaderProps {
  characterName: string;
}

export default function SceneHeader({ characterName }: SceneHeaderProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      );
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 pointer-events-none">
      <span className="text-xs font-mono text-gray-400/70 tracking-wider">
        {time}
      </span>
      <span className="text-xs font-serif font-bold uppercase tracking-[0.25em] text-gray-300/60">
        ДОПРОС
      </span>
      <span className="flex items-center gap-1.5 text-xs text-red-400/70 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        REC
      </span>
    </div>
  );
}

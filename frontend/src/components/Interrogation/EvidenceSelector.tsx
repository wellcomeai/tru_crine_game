import Modal from '../UI/Modal';
import EvidenceCard from '../Game/EvidenceCard';
import { useGameStore } from '../../stores/gameStore';

interface EvidenceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (slug: string, name: string) => void;
}

export default function EvidenceSelector({ isOpen, onClose, onSelect }: EvidenceSelectorProps) {
  const { evidence } = useGameStore();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔍 Предъявить улику">
      <p className="text-xs text-gray-500 mb-3 -mt-2">
        Выберите улику для предъявления подозреваемому.
        Наведите на улику для подробностей.
      </p>
      <div className="space-y-1.5 max-h-96 overflow-y-auto
                      overflow-x-visible pr-1">
        {evidence.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-2xl mb-2 block">🔍</span>
            <p className="text-gray-500 text-sm">Нет собранных улик</p>
            <p className="text-gray-600 text-xs mt-1">
              Осмотрите локации, чтобы найти улики
            </p>
          </div>
        ) : (
          evidence.map((ev) => (
            <EvidenceCard
              key={ev.slug}
              evidence={ev}
              compact
              onClick={() => {
                onSelect(ev.slug, ev.name);
                onClose();
              }}
            />
          ))
        )}
      </div>
    </Modal>
  );
}

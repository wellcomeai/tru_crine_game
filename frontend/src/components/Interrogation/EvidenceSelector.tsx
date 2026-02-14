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
    <Modal isOpen={isOpen} onClose={onClose} title="Предъявить улику">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {evidence.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Нет собранных улик</p>
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

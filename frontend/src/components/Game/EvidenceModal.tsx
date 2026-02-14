import { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import LoadingSpinner from '../UI/LoadingSpinner';
import api from '../../api/client';
import type { Evidence } from '../../types';
import { getImageUrl } from '../../utils/helpers';
import { EVIDENCE_TYPE_ICONS } from '../../utils/constants';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  evidenceSlug: string | null;
}

export default function EvidenceModal({ isOpen, onClose, sessionId, evidenceSlug }: EvidenceModalProps) {
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && evidenceSlug) {
      setLoading(true);
      api.get(`/game/${sessionId}/evidence/${evidenceSlug}`)
        .then(({ data }) => setEvidence(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, evidenceSlug, sessionId]);

  const icon = EVIDENCE_TYPE_ICONS[evidence?.type || ''] || '🔍';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={evidence?.name || 'Улика'}>
      {loading ? (
        <LoadingSpinner />
      ) : evidence ? (
        <div className="space-y-4">
          {evidence.image && (
            <img
              src={getImageUrl(evidence.image)}
              alt={evidence.name}
              className="w-full h-48 object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          {!evidence.image && (
            <div className="w-full h-32 bg-noir-700 rounded-lg flex items-center justify-center text-4xl">
              {icon}
            </div>
          )}
          <div>
            <span className="text-xs text-gold bg-gold/10 px-2 py-1 rounded">
              {evidence.type}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              Важность: {'★'.repeat(evidence.importance)}{'☆'.repeat(5 - evidence.importance)}
            </span>
          </div>
          <p className="text-gray-300">{evidence.description}</p>
          {evidence.detailed_description && (
            <div className="bg-noir-700 p-3 rounded-lg border border-noir-600">
              <p className="text-sm text-gray-300 font-mono">{evidence.detailed_description}</p>
            </div>
          )}
          <div className="flex gap-1 flex-wrap">
            {evidence.tags?.map((tag) => (
              <span key={tag} className="text-xs bg-noir-700 text-gray-400 px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

import { useParams, useNavigate } from 'react-router-dom';
import GameLayout from '../components/Layout/GameLayout';
import LocationCard from '../components/Game/LocationCard';
import CharacterCard from '../components/Game/CharacterCard';
import EvidenceCard from '../components/Game/EvidenceCard';
import EvidenceModal from '../components/Game/EvidenceModal';
import PhaseIndicator from '../components/Game/PhaseIndicator';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { useGame } from '../hooks/useGame';
import { useState } from 'react';

export default function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const game = useGame(sessionId!);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  if (game.loading && !game.state) {
    return (
      <GameLayout>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size={48} />
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout>
      {/* Phase indicator */}
      <div className="mb-6">
        <PhaseIndicator />
      </div>

      {/* Tab content */}
      {game.activeTab === 'locations' && (
        <div>
          <h2 className="font-serif text-xl text-gold mb-4">Локации</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {game.locations.map((loc) => (
              <LocationCard
                key={loc.slug}
                location={loc}
                onClick={() => {
                  if (!loc.is_visited) {
                    game.visitLocation(loc.slug).then(() => {
                      navigate(`/game/${sessionId}/location/${loc.slug}`);
                    });
                  } else {
                    navigate(`/game/${sessionId}/location/${loc.slug}`);
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {game.activeTab === 'characters' && (
        <div>
          <h2 className="font-serif text-xl text-gold mb-4">Персонажи</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {game.characters.map((char) => (
              <CharacterCard
                key={char.slug}
                character={char}
                onClick={() => navigate(`/game/${sessionId}/interrogation/${char.slug}`)}
              />
            ))}
          </div>
        </div>
      )}

      {game.activeTab === 'evidence' && (
        <div>
          <h2 className="font-serif text-xl text-gold mb-4">
            Улики ({game.evidence.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {game.evidence.map((ev) => (
              <EvidenceCard
                key={ev.slug}
                evidence={ev}
                onClick={() => setSelectedEvidence(ev.slug)}
              />
            ))}
          </div>
          {game.evidence.length === 0 && (
            <p className="text-gray-500 text-center py-12">
              Пока не найдено ни одной улики. Осмотрите локации!
            </p>
          )}
        </div>
      )}

      <EvidenceModal
        isOpen={!!selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
        sessionId={sessionId!}
        evidenceSlug={selectedEvidence}
      />
    </GameLayout>
  );
}

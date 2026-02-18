import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import GameLayout from '../components/Layout/GameLayout';
import Button from '../components/UI/Button';
import { useGame } from '../hooks/useGame';
import { toast } from 'sonner';

export default function NotebookPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const game = useGame(sessionId!);
  const [notes, setNotes] = useState(game.state?.player_notes || '');
  const [hypothesis, setHypothesis] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (game.state?.player_notes !== undefined) {
      setNotes(game.state.player_notes);
    }
  }, [game.state?.player_notes]);

  const saveNotes = useCallback(
    (text: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        game.saveNotes(text);
      }, 1000);
    },
    [game.saveNotes]
  );

  const handleNotesChange = (text: string) => {
    setNotes(text);
    saveNotes(text);
  };

  const handleAddHypothesis = async () => {
    if (!hypothesis.trim()) return;
    await game.addHypothesis(hypothesis.trim());
    setHypothesis('');
    toast.success('Версия добавлена');
  };

  return (
    <GameLayout>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`/game/${sessionId}`)}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-serif text-xl text-gold">Блокнот детектива</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes */}
        <div className="bg-noir-800 border border-noir-600 rounded-xl p-4">
          <h3 className="font-serif text-lg text-gray-300 mb-3">Заметки</h3>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Записывайте свои наблюдения..."
            className="w-full h-48 lg:h-80 bg-noir-700 text-gray-300 rounded-lg p-4 border border-noir-600 focus:border-gold-dim focus:outline-none resize-none font-mono text-sm leading-relaxed"
          />
          <p className="text-xs text-gray-600 mt-2">Автосохранение</p>
        </div>

        {/* Hypotheses */}
        <div className="bg-noir-800 border border-noir-600 rounded-xl p-4">
          <h3 className="font-serif text-lg text-gray-300 mb-3">Версии</h3>

          {/* Add hypothesis */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddHypothesis()}
              placeholder="Новая версия..."
              className="flex-1 bg-noir-700 text-gray-200 rounded-lg px-3 py-2 border border-noir-600 focus:border-gold-dim focus:outline-none text-sm"
            />
            <Button onClick={handleAddHypothesis} size="sm" disabled={!hypothesis.trim()}>
              <Plus size={16} />
            </Button>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(game.state?.player_hypotheses || []).map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-noir-700 rounded-lg border border-noir-600"
              >
                <p className="text-sm text-gray-300">{h.text}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(h.created_at).toLocaleString('ru-RU')}
                </p>
              </motion.div>
            ))}
            {(!game.state?.player_hypotheses || game.state.player_hypotheses.length === 0) && (
              <p className="text-gray-600 text-sm text-center py-4">Нет версий</p>
            )}
          </div>
        </div>
      </div>
    </GameLayout>
  );
}

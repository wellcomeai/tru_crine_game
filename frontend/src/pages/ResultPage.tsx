import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/client';
import GameLayout from '../components/Layout/GameLayout';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import type { AccusationResult } from '../types';

function AnimatedScore({ target }: { target: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.floor(target / 60));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);

  return <span>{value}</span>;
}

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<AccusationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/game/${sessionId}/result`)
      .then(({ data }) => setResult(data))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading || !result) {
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
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <h1
            className={`font-serif text-4xl font-bold mb-2 ${
              result.is_correct ? 'text-gold' : 'text-blood-bright'
            }`}
          >
            {result.is_correct ? 'ДЕЛО РАСКРЫТО!' : 'ДЕЛО НЕ РАСКРЫТО'}
          </h1>
          {result.is_correct ? (
            <div className="text-5xl font-bold mt-4">
              <span className="text-gold">
                <AnimatedScore target={result.total_score} />
              </span>
              <span className="text-gray-600 text-2xl">/{result.max_score}</span>
            </div>
          ) : (
            <p className="text-gray-400 mt-4">
              Вы обвинили не того подозреваемого. Вернитесь к расследованию и попробуйте снова.
            </p>
          )}
        </motion.div>

        {/* Breakdown - only show for correct accusations */}
        {result.is_correct && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-noir-800 border border-noir-600 rounded-xl p-6 mb-6"
          >
            <h3 className="font-serif text-lg text-gray-200 mb-4">Разбор</h3>
            <div className="space-y-3">
              {/* Suspect */}
              <div className="flex items-center justify-between p-3 bg-noir-700 rounded-lg">
                <div>
                  <span className="text-gray-300">Подозреваемый</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-green-400">✓</span>
                  <span className="text-gold font-mono">{result.breakdown.suspect.score}</span>
                </div>
              </div>

              {/* Motive */}
              <div className="p-3 bg-noir-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Мотив</span>
                  <span className="text-gold font-mono">{result.breakdown.motive.score}/200</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{result.breakdown.motive.feedback}</p>
              </div>

              {/* Method */}
              <div className="p-3 bg-noir-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Метод</span>
                  <span className="text-gold font-mono">{result.breakdown.method.score}/150</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{result.breakdown.method.feedback}</p>
              </div>

              {/* Evidence */}
              <div className="p-3 bg-noir-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Улики</span>
                  <span className="text-gold font-mono">{result.breakdown.evidence.score}/150</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{result.breakdown.evidence.details}</p>
              </div>

              {/* Bonus */}
              <div className="p-3 bg-noir-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Бонус</span>
                  <span className="text-gold font-mono">{result.breakdown.bonus.score}/50</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{result.breakdown.bonus.details}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Story summary - only show for correct accusations */}
        {result.is_correct && result.story_summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-noir-800 border border-noir-600 rounded-xl p-6 mb-6"
          >
            <h3 className="font-serif text-lg text-gold mb-3">Что произошло на самом деле</h3>
            <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{result.story_summary}</p>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          {!result.is_correct && (
            <Button onClick={() => navigate(`/game/${sessionId}/accuse`)}>
              Попробовать снова
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/cases')}>
            К списку дел
          </Button>
        </div>
      </div>
    </GameLayout>
  );
}

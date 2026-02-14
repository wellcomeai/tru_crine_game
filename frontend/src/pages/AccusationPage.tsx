import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import GameLayout from '../components/Layout/GameLayout';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { useGame } from '../hooks/useGame';
import { getInitials, getImageUrl } from '../utils/helpers';
import { toast } from 'sonner';

export default function AccusationPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const game = useGame(sessionId!);

  const [step, setStep] = useState(1);
  const [accused, setAccused] = useState('');
  const [motive, setMotive] = useState('');
  const [method, setMethod] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!accused) {
      toast.error('Выберите подозреваемого');
      return;
    }
    if (!motive.trim()) {
      toast.error('Укажите мотив');
      return;
    }
    if (!method.trim()) {
      toast.error('Укажите метод');
      return;
    }

    setSubmitting(true);
    try {
      await game.accuse({
        accused_slug: accused,
        motive,
        method,
        supporting_evidence: selectedEvidence,
      });
      navigate(`/game/${sessionId}/result`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEvidence = (slug: string) => {
    setSelectedEvidence((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
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
        <h2 className="font-serif text-xl text-gold">Предъявление обвинения</h2>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                s === step
                  ? 'bg-gold text-noir-900'
                  : s < step
                  ? 'bg-green-900 text-green-300'
                  : 'bg-noir-700 text-gray-500'
              }`}
            >
              {s < step ? <Check size={14} /> : s}
            </div>
            {s < 4 && <div className="w-8 h-0.5 bg-noir-600" />}
          </div>
        ))}
      </div>

      <div className="max-w-2xl">
        <AnimatePresence mode="wait">
          {/* Step 1: Select suspect */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg text-gray-200 mb-4">Кого вы обвиняете?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {game.characters
                  .filter((c) => !c.is_locked)
                  .map((char) => (
                    <button
                      key={char.slug}
                      onClick={() => setAccused(char.slug)}
                      className={`p-4 rounded-lg border text-left transition-all flex items-center gap-3 ${
                        accused === char.slug
                          ? 'border-gold bg-gold/10'
                          : 'border-noir-600 bg-noir-800 hover:border-noir-500'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-noir-700 flex items-center justify-center text-gold font-bold text-sm">
                        {getInitials(char.name)}
                      </div>
                      <div>
                        <div className="text-gray-200 font-semibold">{char.name}</div>
                        <div className="text-xs text-gray-500">{char.occupation}</div>
                      </div>
                    </button>
                  ))}
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!accused}>
                  Далее <ArrowRight size={16} className="ml-1 inline" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Motive */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg text-gray-200 mb-4">Какой мотив?</h3>
              <textarea
                value={motive}
                onChange={(e) => setMotive(e.target.value)}
                placeholder="Опишите мотив преступления..."
                className="w-full h-32 bg-noir-700 text-gray-200 rounded-lg p-4 border border-noir-600 focus:border-gold-dim focus:outline-none resize-none"
              />
              <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} className="mr-1 inline" /> Назад
                </Button>
                <Button onClick={() => setStep(3)} disabled={!motive.trim()}>
                  Далее <ArrowRight size={16} className="ml-1 inline" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Method */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg text-gray-200 mb-4">Каким методом?</h3>
              <textarea
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="Опишите метод совершения преступления..."
                className="w-full h-32 bg-noir-700 text-gray-200 rounded-lg p-4 border border-noir-600 focus:border-gold-dim focus:outline-none resize-none"
              />
              <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft size={16} className="mr-1 inline" /> Назад
                </Button>
                <Button onClick={() => setStep(4)} disabled={!method.trim()}>
                  Далее <ArrowRight size={16} className="ml-1 inline" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Supporting evidence */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg text-gray-200 mb-4">Подтверждающие улики</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {game.evidence.map((ev) => (
                  <label
                    key={ev.slug}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedEvidence.includes(ev.slug)
                        ? 'border-gold bg-gold/10'
                        : 'border-noir-600 bg-noir-800 hover:border-noir-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvidence.includes(ev.slug)}
                      onChange={() => toggleEvidence(ev.slug)}
                      className="accent-gold"
                    />
                    <span className="text-sm text-gray-300">{ev.name}</span>
                    {ev.is_key_evidence && (
                      <span className="text-xs text-gold bg-gold/10 px-1.5 py-0.5 rounded ml-auto">
                        KEY
                      </span>
                    )}
                  </label>
                ))}
              </div>
              <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(3)}>
                  <ArrowLeft size={16} className="mr-1 inline" /> Назад
                </Button>
                <Button variant="danger" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <LoadingSpinner size={18} />
                  ) : (
                    'Предъявить обвинение'
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}

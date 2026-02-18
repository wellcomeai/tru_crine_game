import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, CheckCircle, X } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';
import { EVIDENCE_TYPE_ICONS } from '../../utils/constants';
import { toast } from 'sonner';

export default function BoardListView() {
  const { evidence, state, connectEvidence, disconnectEvidence } = useGameStore();
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const connections = state?.player_connections || [];

  const handleConnect = async (slugA: string, slugB: string) => {
    try {
      const result = await connectEvidence(slugA, slugB);
      if (result?.connection?.is_confirmed) {
        toast.success(`Связь подтверждена: ${result.connection.confirmation_text}`);
      } else {
        toast.success('Связь создана');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка создания связи');
    }
    setConnectingFrom(null);
  };

  return (
    <div className="h-full overflow-y-auto px-3 py-4 space-y-4">
      {/* Connections section */}
      {connections.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
            Связи ({connections.length})
          </h3>
          <div className="space-y-1.5">
            {connections.map((conn) => {
              const evA = evidence.find((e) => e.slug === conn.a);
              const evB = evidence.find((e) => e.slug === conn.b);
              if (!evA || !evB) return null;

              return (
                <div
                  key={`${conn.a}-${conn.b}`}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                    conn.is_confirmed
                      ? 'bg-green-900/10 border-green-700/30'
                      : 'bg-noir-800 border-noir-600/30'
                  }`}
                >
                  <span className="text-xs text-gray-300 truncate flex-1">{evA.name}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {conn.is_confirmed ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : (
                      <Link2 size={14} className="text-red-400" />
                    )}
                  </div>
                  <span className="text-xs text-gray-300 truncate flex-1 text-right">{evB.name}</span>
                </div>
              );
            })}
          </div>
          {connections.some((c) => c.is_confirmed && c.confirmation_text) && (
            <div className="mt-2 space-y-1">
              {connections.filter((c) => c.is_confirmed && c.confirmation_text).map((c) => (
                <p key={`${c.a}-${c.b}-text`} className="text-[11px] text-green-400/70 px-1">
                  ✓ {c.confirmation_text}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Evidence list */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
          Улики ({evidence.length})
        </h3>

        {/* Connection mode banner */}
        <AnimatePresence>
          {connectingFrom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 px-3 py-2 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-between"
            >
              <span className="text-xs text-gold">
                Выберите вторую улику для связи
              </span>
              <button
                onClick={() => setConnectingFrom(null)}
                className="text-gray-400 active:text-gray-200 min-w-[32px] min-h-[32px] flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1.5">
          {evidence.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">Осмотрите локации, чтобы найти улики</p>
            </div>
          ) : (
            evidence.map((ev) => {
              const icon = EVIDENCE_TYPE_ICONS[ev.type || ''] || '🔍';
              const isSource = connectingFrom === ev.slug;

              return (
                <div
                  key={ev.slug}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border transition-colors ${
                    isSource
                      ? 'bg-gold/10 border-gold/40'
                      : connectingFrom
                      ? 'bg-noir-800 border-noir-600/30 active:bg-noir-700'
                      : 'bg-noir-800 border-noir-600/30'
                  }`}
                  onClick={() => {
                    if (connectingFrom && connectingFrom !== ev.slug) {
                      handleConnect(connectingFrom, ev.slug);
                    }
                  }}
                >
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{ev.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{ev.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {ev.is_key_evidence && (
                      <span className="text-[9px] text-gold bg-gold/10 px-1.5 py-0.5 rounded font-bold">
                        KEY
                      </span>
                    )}
                    {!connectingFrom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConnectingFrom(ev.slug);
                        }}
                        className="text-gray-500 active:text-gold
                                   min-w-[36px] min-h-[36px]
                                   flex items-center justify-center
                                   rounded-lg hover:bg-noir-700"
                      >
                        <Link2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

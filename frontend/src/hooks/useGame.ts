import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';

export function useGame(sessionId: string) {
  const store = useGameStore();

  useEffect(() => {
    if (sessionId && sessionId !== store.sessionId) {
      store.setSessionId(sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    if (store.sessionId) {
      store.loadState();
      store.loadLocations();
      store.loadCharacters();
      store.loadEvidence();
      store.loadPhases();
    }
  }, [store.sessionId]);

  return store;
}

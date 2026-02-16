import { create } from 'zustand';
import api from '../api/client';
import type {
  Location, Character, Evidence, Phase,
  PlayerState, Notification, AccusationData, AccusationResult,
  GameStateResponse,
} from '../types';

interface GameStore {
  sessionId: string | null;
  caseData: GameStateResponse['case'] | null;
  state: PlayerState | null;
  locations: Location[];
  characters: Character[];
  evidence: Evidence[];
  phases: Phase[];
  notifications: Notification[];
  activeTab: 'locations' | 'characters' | 'evidence';
  loading: boolean;
  showAboutModal: boolean;

  setSessionId: (id: string) => void;
  setActiveTab: (tab: 'locations' | 'characters' | 'evidence') => void;
  setShowAboutModal: (show: boolean) => void;
  startCase: (caseId: string) => Promise<string>;
  loadState: () => Promise<void>;
  loadLocations: () => Promise<void>;
  loadCharacters: () => Promise<void>;
  loadEvidence: () => Promise<void>;
  loadPhases: () => Promise<void>;
  visitLocation: (slug: string) => Promise<any>;
  examinePoi: (locationSlug: string, poiId: string) => Promise<any>;
  connectEvidence: (a: string, b: string, note?: string) => Promise<any>;
  disconnectEvidence: (a: string, b: string) => Promise<void>;
  saveNotes: (text: string) => Promise<void>;
  addHypothesis: (text: string) => Promise<void>;
  undo: () => Promise<void>;
  accuse: (data: AccusationData) => Promise<AccusationResult>;
  addNotification: (n: Notification) => void;
  dismissNotification: (id: string) => void;
  processUnlocks: (unlocks: any) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  sessionId: null,
  caseData: null,
  state: null,
  locations: [],
  characters: [],
  evidence: [],
  phases: [],
  notifications: [],
  activeTab: 'locations',
  loading: false,
  showAboutModal: false,

  setSessionId: (id: string) => set({ sessionId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setShowAboutModal: (show: boolean) => set({ showAboutModal: show }),

  startCase: async (caseId: string) => {
    const { data } = await api.post(`/cases/${caseId}/start`);
    set({ sessionId: data.session_id });
    return data.session_id;
  },

  loadState: async () => {
    const { sessionId } = get();
    if (!sessionId) return;
    set({ loading: true });
    try {
      const { data } = await api.get(`/game/${sessionId}/state`);
      set({ caseData: data.case, state: data.state });
    } finally {
      set({ loading: false });
    }
  },

  loadLocations: async () => {
    const { sessionId } = get();
    if (!sessionId) return;
    const { data } = await api.get(`/game/${sessionId}/locations`);
    set({ locations: data });
  },

  loadCharacters: async () => {
    const { sessionId } = get();
    if (!sessionId) return;
    const { data } = await api.get(`/game/${sessionId}/characters`);
    set({ characters: data });
  },

  loadEvidence: async () => {
    const { sessionId } = get();
    if (!sessionId) return;
    const { data } = await api.get(`/game/${sessionId}/evidence`);
    set({ evidence: data });
  },

  loadPhases: async () => {
    const { sessionId } = get();
    if (!sessionId) return;
    const { data } = await api.get(`/game/${sessionId}/phases`);
    set({ phases: data });
  },

  visitLocation: async (slug: string) => {
    const { sessionId } = get();
    if (!sessionId) return;
    const { data } = await api.post(`/game/${sessionId}/visit`, { location_slug: slug });
    get().processUnlocks(data.unlocks);
    await get().loadState();
    await get().loadLocations();
    return data;
  },

  examinePoi: async (locationSlug: string, poiId: string) => {
    const { sessionId } = get();
    if (!sessionId) return;
    const { data } = await api.post(`/game/${sessionId}/examine`, {
      location_slug: locationSlug,
      poi_id: poiId,
    });
    get().processUnlocks(data.unlocks);
    await get().loadState();
    await get().loadLocations();
    if (data.evidence) {
      await get().loadEvidence();
    }
    return data;
  },

  connectEvidence: async (a: string, b: string, note?: string) => {
    const { sessionId } = get();
    if (!sessionId) return;
    const { data } = await api.post(`/game/${sessionId}/connect`, {
      evidence_a_slug: a,
      evidence_b_slug: b,
      note: note || '',
    });
    get().processUnlocks(data.unlocks);
    await get().loadState();
    return data;
  },

  disconnectEvidence: async (a: string, b: string) => {
    const { sessionId } = get();
    if (!sessionId) return;
    await api.delete(`/game/${sessionId}/connect`, {
      data: { evidence_a_slug: a, evidence_b_slug: b },
    });
    await get().loadState();
  },

  saveNotes: async (text: string) => {
    const { sessionId } = get();
    if (!sessionId) return;
    await api.post(`/game/${sessionId}/notes`, { text });
  },

  addHypothesis: async (text: string) => {
    const { sessionId } = get();
    if (!sessionId) return;
    await api.post(`/game/${sessionId}/hypothesis`, { text });
    await get().loadState();
  },

  undo: async () => {
    const { sessionId } = get();
    if (!sessionId) return;
    await api.post(`/game/${sessionId}/undo`);
    await get().loadState();
    await get().loadLocations();
    await get().loadEvidence();
  },

  accuse: async (accusationData: AccusationData) => {
    const { sessionId } = get();
    if (!sessionId) throw new Error('No session');
    const { data } = await api.post(`/game/${sessionId}/accuse`, accusationData);
    return data;
  },

  addNotification: (n: Notification) => {
    set((s) => ({ notifications: [...s.notifications, n] }));
    setTimeout(() => get().dismissNotification(n.id), 5000);
  },

  dismissNotification: (id: string) => {
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
  },

  processUnlocks: (unlocks: any) => {
    if (!unlocks) return;
    const notifications: Notification[] = [];

    for (const loc of unlocks.new_locations || []) {
      notifications.push({
        id: `loc-${loc.slug}-${Date.now()}`,
        type: 'location',
        title: 'Новая локация!',
        description: loc.name,
        slug: loc.slug,
      });
    }
    for (const char of unlocks.new_characters || []) {
      notifications.push({
        id: `char-${char.slug}-${Date.now()}`,
        type: 'character',
        title: 'Новый персонаж!',
        description: char.name,
        slug: char.slug,
      });
    }
    for (const ev of unlocks.new_evidence || []) {
      notifications.push({
        id: `ev-${ev.slug}-${Date.now()}`,
        type: 'evidence',
        title: 'Новая улика!',
        description: ev.name,
        slug: ev.slug,
      });
    }
    for (const phase of unlocks.new_phases || []) {
      notifications.push({
        id: `phase-${phase.id}-${Date.now()}`,
        type: 'phase',
        title: 'Новая фаза!',
        description: phase.name,
        slug: phase.id,
      });
    }

    notifications.forEach((n) => get().addNotification(n));
  },
}));

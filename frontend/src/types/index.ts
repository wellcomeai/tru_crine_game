export interface Case {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_time_min: number;
  cover_image: string | null;
  phases: Phase[];
}

export interface Phase {
  id: string;
  name: string;
  description: string;
  is_completed: boolean;
  is_current: boolean;
  is_locked: boolean;
}

export interface Location {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  is_visited: boolean;
  is_locked: boolean;
  lock_reason?: string | null;
  points_of_interest: PointOfInterest[];
}

export interface PointOfInterest {
  id: string;
  x_percent: number;
  y_percent: number;
  width_percent: number;
  height_percent: number;
  label: string;
  description: string;
  is_examined: boolean;
  has_evidence: boolean;
}

export interface Character {
  id: string;
  slug: string;
  name: string;
  role: string | null;
  age: number | null;
  occupation: string | null;
  avatar: string | null;
  is_interrogated: boolean;
  is_locked: boolean;
  current_emotion: string;
}

export interface Evidence {
  id: string;
  slug: string;
  name: string;
  type: string | null;
  description: string | null;
  detailed_description?: string | null;
  image: string | null;
  importance: number;
  tags: string[];
  is_key_evidence: boolean;
}

export interface PlayerState {
  visited_locations: string[];
  collected_evidence: string[];
  unlocked_characters: string[];
  examined_pois: string[];
  player_connections: PlayerConnection[];
  player_notes: string;
  player_hypotheses: Hypothesis[];
}

export interface PlayerConnection {
  a: string;
  b: string;
  note: string;
  is_confirmed: boolean;
  confirmation_text?: string;
}

export interface Hypothesis {
  text: string;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  evidence_shown?: string | null;
}

export interface AccusationData {
  accused_slug: string;
  motive: string;
  method: string;
  supporting_evidence: string[];
}

export interface AccusationResult {
  is_correct: boolean;
  total_score: number;
  max_score: number;
  breakdown: {
    suspect: { correct: boolean; score: number; correct_answer: string };
    motive: { score: number; feedback: string };
    method: { score: number; feedback: string };
    evidence: { score: number; details: string };
    bonus: { score: number; details: string };
  };
  story_summary: string;
}

export interface Notification {
  id: string;
  type: 'location' | 'character' | 'evidence' | 'phase';
  title: string;
  description: string;
  slug: string;
}

export interface StreamEvent {
  type: 'stream' | 'emotion' | 'unlock' | 'done' | 'error';
  content?: string;
  emotion?: string;
  items?: any;
  full_response?: string;
  message?: string;
}

export interface GameStateResponse {
  session_id: string;
  case: {
    id: string;
    slug: string;
    title: string;
    description: string;
    difficulty: string;
    cover_image: string | null;
  };
  state: PlayerState;
  current_phase: string;
  status: string;
}

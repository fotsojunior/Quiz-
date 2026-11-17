export type Continent = 'Europe' | 'Afrique' | 'Asie' | 'Amériques' | 'Océanie';

export interface Country {
  code: string;
  name: string;
  capital: string;
  continent: Continent;
  flag: string;
}

export interface CountryStanding {
  code: string;
  points: number;
  wins: number;
  losses: number;
  streak: number;
  bestStreak: number;
  lastDelta: number;
  updatedAt: number;
}

export interface ScoreEvent {
  id: string;
  playerName: string;
  countryCode: string;
  rivalCode: string | null;
  challengeId: number;
  category: ChallengeCategory;
  won: boolean;
  countryDelta: number;
  rivalDelta: number;
  timestamp: number;
}

export type ChallengeCategory =
  | 'enigma'
  | 'logic'
  | 'focus'
  | 'speed'
  | 'creation'
  | 'riddle';

export type Difficulty = 'facile' | 'moyen' | 'difficile' | 'maitre';

export interface ChallengeMeta {
  id: number; // 1 .. 12500
  category: ChallengeCategory;
  difficulty: Difficulty;
  title: string;
  timeLimitSec: number;
  basePoints: number;
  penaltyPoints: number;
}

export interface McqChallenge extends ChallengeMeta {
  kind: 'mcq';
  prompt: string;
  hint?: string;
  visual?:
    | { type: 'sequence'; items: string[] }
    | { type: 'flag'; countryCode: string; flag: string }
    | { type: 'cipher'; encoded: string; ruleHint: string }
    | { type: 'equation'; rows: string[] }
    | { type: 'matrix'; cells: Array<{ shape: string; color: string; count: number; rotation: number } | null> }
    | { type: 'icons'; tokens: string[] };
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MemoryGridChallenge extends ChallengeMeta {
  kind: 'memory-grid';
  prompt: string;
  gridSize: number; // 3, 4, or 5
  targets: number[]; // sorted cell indices
  previewMs: number;
  explanation: string;
}

export interface SpotDiffChallenge extends ChallengeMeta {
  kind: 'spot-diff';
  prompt: string;
  gridSize: number; // 4, 5, or 6
  baseShape: 'circle' | 'square' | 'triangle' | 'diamond' | 'hex';
  baseColor: string;
  baseRotation: number;
  baseLabel: string;
  oddIndex: number;
  oddShape: 'circle' | 'square' | 'triangle' | 'diamond' | 'hex';
  oddColor: string;
  oddRotation: number;
  oddLabel: string;
  explanation: string;
}

export interface SimonSeqChallenge extends ChallengeMeta {
  kind: 'simon-seq';
  prompt: string;
  reverse: boolean;
  sequence: number[]; // indices 0..5
  padColors: string[];
  padLabels: string[];
  explanation: string;
}

export interface StroopChallenge extends ChallengeMeta {
  kind: 'stroop';
  prompt: string;
  askFor: 'ink' | 'word';
  wordText: string;
  inkColorName: string;
  inkHex: string;
  options: Array<{ label: string; hex: string }>;
  correctIndex: number;
  explanation: string;
}

export interface OrderTapChallenge extends ChallengeMeta {
  kind: 'order-tap';
  prompt: string;
  descending: boolean;
  tiles: Array<{ id: number; label: string; value: number }>;
  explanation: string;
}

export interface WordScrambleChallenge extends ChallengeMeta {
  kind: 'word-scramble';
  prompt: string;
  clue: string;
  targetWord: string;
  scrambledLetters: string[];
  explanation: string;
}

export interface SymmetryDrawChallenge extends ChallengeMeta {
  kind: 'symmetry-draw';
  prompt: string;
  gridSize: number; // 5 or 6
  axis: 'vertical' | 'horizontal';
  givenCells: number[]; // locked pattern cells on one half
  targetMissingCells: number[]; // cells player must toggle on the other half
  explanation: string;
}

export interface PipeConnectChallenge extends ChallengeMeta {
  kind: 'pipe-connect';
  prompt: string;
  gridSize: 4;
  // Each tile has bitmask connections: 1=N, 2=E, 4=S, 8=W
  // Type: 'straight' | 'corner' | 'tee'
  tiles: Array<{
    type: 'straight' | 'corner' | 'tee';
    initialRot: number; // 0, 1, 2, 3 (90deg clockwise steps)
    solvedRot: number;
  }>;
  startIndex: number; // enters from West on startIndex
  endIndex: number; // exits to East on endIndex
  explanation: string;
}

export interface LogicArrangeChallenge extends ChallengeMeta {
  kind: 'logic-arrange';
  prompt: string;
  items: Array<{ id: string; label: string; color: string }>;
  clues: string[];
  solutionIds: string[];
  explanation: string;
}

export type Challenge =
  | McqChallenge
  | MemoryGridChallenge
  | SpotDiffChallenge
  | SimonSeqChallenge
  | StroopChallenge
  | OrderTapChallenge
  | WordScrambleChallenge
  | SymmetryDrawChallenge
  | PipeConnectChallenge
  | LogicArrangeChallenge;

export interface DuelPlayerState {
  clientId: string;
  userId?: string;
  playerName: string;
  countryCode: string;
  roundScores: number[];
  totalScore: number;
  currentRoundDone: boolean;
  lastRoundCorrect: boolean | null;
}

export interface LiveDuelRoom {
  roomId: string;
  status: 'waiting' | 'playing' | 'finished';
  challengeIds: number[];
  currentRound: number; // 0..4
  players: DuelPlayerState[];
  winnerClientId: string | null;
  countryPointsAwarded: number;
  countryPointsLost: number;
}

export interface UserCategoryStats {
  played: number;
  won: number;
  points: number;
}

export interface UserHistoryEntry {
  id: string;
  challengeId: number;
  title: string;
  category: ChallengeCategory;
  difficulty: Difficulty;
  won: boolean;
  userPointsDelta: number;
  countryDelta: number;
  countryCode: string;
  rivalCode: string | null;
  mode: 'solo' | 'duel' | 'shared';
  timestamp: number;
}

export interface UserProfile {
  userId: string;
  syncCode: string;
  playerName: string;
  countryCode: string;
  rivalCode: string | null;
  userPoints: number;
  wins: number;
  losses: number;
  currentStreak: number;
  bestStreak: number;
  answeredCount: number;
  solvedIds: number[];
  categoryStats: Record<ChallengeCategory, UserCategoryStats>;
  history: UserHistoryEntry[];
  createdAt: number;
  updatedAt: number;
}

export interface SharedChallengeAttempt {
  playerName: string;
  countryCode: string;
  won: boolean;
  pointsDelta: number;
  timestamp: number;
}

export interface SharedChallengeInfo {
  shareId: string;
  challengeId: number;
  creatorUserId: string;
  creatorName: string;
  creatorCountryCode: string;
  creatorWon: boolean | null;
  creatorPointsDelta: number;
  attempts: SharedChallengeAttempt[];
  createdAt: number;
}

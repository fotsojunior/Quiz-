import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';
import { COUNTRIES, COUNTRY_MAP } from './src/data/countries.ts';
import type {
  ChallengeCategory,
  CountryStanding,
  Difficulty,
  DuelPlayerState,
  LiveDuelRoom,
  ScoreEvent,
  SharedChallengeInfo,
  UserCategoryStats,
  UserHistoryEntry,
  UserProfile,
} from './src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveWritableDataDir(): string {
  const preferred = path.join(__dirname, 'data');
  try {
    if (!fs.existsSync(preferred)) {
      fs.mkdirSync(preferred, { recursive: true });
    }
    fs.accessSync(preferred, fs.constants.W_OK);
    return preferred;
  } catch {
    const fallback = path.join(os.tmpdir(), 'quiz-data');
    try {
      if (!fs.existsSync(fallback)) {
        fs.mkdirSync(fallback, { recursive: true });
      }
    } catch {
      // Ignore if tmpdir creation fails
    }
    return fallback;
  }
}

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = resolveWritableDataDir();
const DATA_FILE = path.join(DATA_DIR, 'world-scores.json');
const DATA_TMP_FILE = path.join(DATA_DIR, 'world-scores.json.tmp');
const TOTAL_CHALLENGES = 12500;
const VALID_CATEGORIES = new Set<ChallengeCategory>([
  'enigma',
  'logic',
  'focus',
  'speed',
  'creation',
  'riddle',
]);

const USERS_FILE = path.join(DATA_DIR, 'users-state.json');
const USERS_TMP_FILE = path.join(DATA_DIR, 'users-state.json.tmp');
const VALID_DIFFICULTIES = new Set<Difficulty>(['facile', 'moyen', 'difficile', 'maitre']);

interface PersistedState {
  standings: Record<string, CountryStanding>;
  recentEvents: ScoreEvent[];
}

interface PersistedUsersState {
  users: Record<string, UserProfile>;
  syncCodes: Record<string, string>;
  sharedChallenges: Record<string, SharedChallengeInfo>;
  waitingRooms: Record<string, InternalRoom>;
}

interface InternalRoom extends LiveDuelRoom {
  createdAt: number;
  lastActivityAt: number;
}

function createInitialState(): PersistedState {
  const now = Date.now();
  const standings: Record<string, CountryStanding> = {};
  for (const country of COUNTRIES) {
    standings[country.code] = {
      code: country.code,
      points: 1000,
      wins: 0,
      losses: 0,
      streak: 0,
      bestStreak: 0,
      lastDelta: 0,
      updatedAt: now,
    };
  }
  return { standings, recentEvents: [] };
}

function loadState(): PersistedState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as PersistedState;
      const base = createInitialState();
      for (const code of Object.keys(base.standings)) {
        if (parsed.standings?.[code]) {
          base.standings[code] = {
            ...base.standings[code],
            ...parsed.standings[code],
            code,
            points: Math.max(0, Number(parsed.standings[code].points) || 0),
            wins: Math.max(0, Number(parsed.standings[code].wins) || 0),
            losses: Math.max(0, Number(parsed.standings[code].losses) || 0),
            streak: Math.max(0, Number(parsed.standings[code].streak) || 0),
            bestStreak: Math.max(0, Number(parsed.standings[code].bestStreak) || 0),
          };
        }
      }
      base.recentEvents = Array.isArray(parsed.recentEvents)
        ? parsed.recentEvents.slice(0, 40)
        : [];
      return base;
    }
  } catch (err) {
    console.error('Failed to load world-scores.json, starting fresh:', err);
  }
  return createInitialState();
}

let state: PersistedState = loadState();
let standingsDirty = true;
let cachedSortedStandings: CountryStanding[] = [];

function getSortedStandings(): CountryStanding[] {
  if (!standingsDirty && cachedSortedStandings.length > 0) {
    return cachedSortedStandings;
  }
  cachedSortedStandings = Object.values(state.standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.code.localeCompare(b.code);
  });
  standingsDirty = false;
  return cachedSortedStandings;
}

// Atomic, non-blocking disk persistence with coalescing
let saveTimer: NodeJS.Timeout | null = null;
let isSaving = false;
let saveQueued = false;

async function flushSaveAsync() {
  if (isSaving) {
    saveQueued = true;
    return;
  }
  isSaving = true;
  saveQueued = false;
  try {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    const snapshot = JSON.stringify(state);
    await fsp.writeFile(DATA_TMP_FILE, snapshot, 'utf-8');
    await fsp.rename(DATA_TMP_FILE, DATA_FILE);
  } catch (err) {
    console.error('Failed to persist world-scores.json:', err);
  } finally {
    isSaving = false;
    if (saveQueued) {
      void flushSaveAsync();
    }
  }
}

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void flushSaveAsync();
  }, 500);
}

function flushSaveSync() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_TMP_FILE, JSON.stringify(state), 'utf-8');
    fs.renameSync(DATA_TMP_FILE, DATA_FILE);
    fs.writeFileSync(USERS_TMP_FILE, JSON.stringify(buildUsersSnapshot()), 'utf-8');
    fs.renameSync(USERS_TMP_FILE, USERS_FILE);
  } catch (err) {
    console.error('Failed sync save on shutdown:', err);
  }
}

// ==========================================
// USER PROFILES, PARCOURS & SHARED CHALLENGES
// ==========================================
function createEmptyCategoryStats(): Record<ChallengeCategory, UserCategoryStats> {
  return {
    enigma: { played: 0, won: 0, points: 0 },
    logic: { played: 0, won: 0, points: 0 },
    focus: { played: 0, won: 0, points: 0 },
    speed: { played: 0, won: 0, points: 0 },
    creation: { played: 0, won: 0, points: 0 },
    riddle: { played: 0, won: 0, points: 0 },
  };
}

function loadUsersState(): PersistedUsersState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<PersistedUsersState>;
      return {
        users: parsed.users && typeof parsed.users === 'object' ? parsed.users : {},
        syncCodes: parsed.syncCodes && typeof parsed.syncCodes === 'object' ? parsed.syncCodes : {},
        sharedChallenges:
          parsed.sharedChallenges && typeof parsed.sharedChallenges === 'object'
            ? parsed.sharedChallenges
            : {},
        waitingRooms:
          parsed.waitingRooms && typeof parsed.waitingRooms === 'object'
            ? parsed.waitingRooms
            : {},
      };
    }
  } catch (err) {
    console.error('Failed to load users-state.json, starting fresh:', err);
  }
  return { users: {}, syncCodes: {}, sharedChallenges: {}, waitingRooms: {} };
}

const usersState: PersistedUsersState = loadUsersState();

function buildUsersSnapshot(): PersistedUsersState {
  const waitingRooms: Record<string, InternalRoom> = {};
  for (const [roomId, room] of rooms) {
    if (room.status === 'waiting') {
      waitingRooms[roomId] = room;
    }
  }
  return {
    users: usersState.users,
    syncCodes: usersState.syncCodes,
    sharedChallenges: usersState.sharedChallenges,
    waitingRooms,
  };
}

let usersSaveTimer: NodeJS.Timeout | null = null;
let isUsersSaving = false;
let usersSaveQueued = false;

async function flushUsersSaveAsync() {
  if (isUsersSaving) {
    usersSaveQueued = true;
    return;
  }
  isUsersSaving = true;
  usersSaveQueued = false;
  try {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    const snapshot = JSON.stringify(buildUsersSnapshot());
    await fsp.writeFile(USERS_TMP_FILE, snapshot, 'utf-8');
    await fsp.rename(USERS_TMP_FILE, USERS_FILE);
  } catch (err) {
    console.error('Failed to persist users-state.json:', err);
  } finally {
    isUsersSaving = false;
    if (usersSaveQueued) {
      void flushUsersSaveAsync();
    }
  }
}

function scheduleUsersSave() {
  if (usersSaveTimer) return;
  usersSaveTimer = setTimeout(() => {
    usersSaveTimer = null;
    void flushUsersSaveAsync();
  }, 600);
}

function generateUserId(): string {
  return `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function generateSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 50; attempt++) {
    let part1 = '';
    let part2 = '';
    for (let i = 0; i < 4; i++) {
      part1 += chars[Math.floor(Math.random() * chars.length)];
      part2 += chars[Math.floor(Math.random() * chars.length)];
    }
    const code = `QZ-${part1}-${part2}`;
    if (!usersState.syncCodes[code]) return code;
  }
  return `QZ-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

function generateShareId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  for (let attempt = 0; attempt < 40; attempt++) {
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!usersState.sharedChallenges[id]) return id;
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function sanitizeUserId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().slice(0, 64);
  if (!/^[a-zA-Z0-9_-]{6,64}$/.test(cleaned)) return null;
  return cleaned;
}

function getOrCreateUserProfile(params: {
  userId?: unknown;
  playerName?: unknown;
  countryCode?: unknown;
  rivalCode?: unknown;
  localSnapshot?: {
    answeredCount?: unknown;
    solvedIds?: unknown;
    userPoints?: unknown;
    wins?: unknown;
    losses?: unknown;
    bestStreak?: unknown;
  };
}): UserProfile {
  const validId = sanitizeUserId(params.userId);
  const now = Date.now();

  if (validId && usersState.users[validId]) {
    const existing = usersState.users[validId];
    // Ensure all fields exist cleanly
    if (!existing.categoryStats) existing.categoryStats = createEmptyCategoryStats();
    if (!Array.isArray(existing.history)) existing.history = [];
    if (!Array.isArray(existing.solvedIds)) existing.solvedIds = [];
    if (!existing.syncCode) {
      existing.syncCode = generateSyncCode();
      usersState.syncCodes[existing.syncCode] = existing.userId;
      scheduleUsersSave();
    }
    return existing;
  }

  const userId = validId ?? generateUserId();
  const syncCode = generateSyncCode();
  const countryCode =
    typeof params.countryCode === 'string' && COUNTRY_MAP.has(params.countryCode)
      ? params.countryCode
      : 'FR';
  const rivalCode =
    typeof params.rivalCode === 'string' &&
    params.rivalCode !== countryCode &&
    COUNTRY_MAP.has(params.rivalCode)
      ? params.rivalCode
      : null;

  const snap = params.localSnapshot;
  const snapAnswered = Math.max(0, Math.min(100000, Math.floor(Number(snap?.answeredCount) || 0)));
  const snapSolved = Array.isArray(snap?.solvedIds)
    ? Array.from(
        new Set(
          snap.solvedIds
            .map((x) => Math.floor(Number(x)))
            .filter((n) => Number.isFinite(n) && n >= 1 && n <= TOTAL_CHALLENGES)
        )
      )
    : [];
  const snapPoints = Math.max(0, Math.min(10000000, Math.floor(Number(snap?.userPoints) || 0)));
  const snapWins = Math.max(0, Math.floor(Number(snap?.wins) || snapSolved.length));
  const snapLosses = Math.max(0, Math.floor(Number(snap?.losses) || 0));
  const snapBestStreak = Math.max(0, Math.floor(Number(snap?.bestStreak) || 0));

  const profile: UserProfile = {
    userId,
    syncCode,
    playerName: sanitizePlayerName(params.playerName ?? 'Champion'),
    countryCode,
    rivalCode,
    userPoints: snapPoints > 0 ? snapPoints : snapSolved.length * 20,
    wins: snapWins,
    losses: snapLosses,
    currentStreak: 0,
    bestStreak: snapBestStreak,
    answeredCount: Math.max(snapAnswered, snapSolved.length),
    solvedIds: snapSolved,
    categoryStats: createEmptyCategoryStats(),
    history: [],
    createdAt: now,
    updatedAt: now,
  };

  usersState.users[userId] = profile;
  usersState.syncCodes[syncCode] = userId;
  scheduleUsersSave();
  return profile;
}

function recordUserOutcome(params: {
  userId: string;
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
  countAsAnswered?: boolean;
}): UserProfile | null {
  const profile = usersState.users[params.userId];
  if (!profile) return null;

  const now = Date.now();
  const cat: ChallengeCategory = VALID_CATEGORIES.has(params.category) ? params.category : 'enigma';
  const diff: Difficulty = VALID_DIFFICULTIES.has(params.difficulty) ? params.difficulty : 'facile';

  if (!profile.categoryStats) profile.categoryStats = createEmptyCategoryStats();
  if (!profile.categoryStats[cat]) {
    profile.categoryStats[cat] = { played: 0, won: 0, points: 0 };
  }

  const prevPts = profile.userPoints;
  profile.userPoints = Math.max(0, prevPts + params.userPointsDelta);
  const actualDelta = profile.userPoints - prevPts;

  if (params.won) {
    profile.wins += 1;
    profile.currentStreak += 1;
    profile.bestStreak = Math.max(profile.bestStreak, profile.currentStreak);
    if (
      params.challengeId >= 1 &&
      params.challengeId <= TOTAL_CHALLENGES &&
      !profile.solvedIds.includes(params.challengeId)
    ) {
      profile.solvedIds.push(params.challengeId);
    }
  } else {
    profile.losses += 1;
    profile.currentStreak = 0;
  }

  if (params.countAsAnswered !== false) {
    profile.answeredCount += 1;
  }

  profile.categoryStats[cat].played += 1;
  if (params.won) profile.categoryStats[cat].won += 1;
  profile.categoryStats[cat].points = Math.max(0, profile.categoryStats[cat].points + actualDelta);

  const entry: UserHistoryEntry = {
    id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
    challengeId: params.challengeId,
    title: String(params.title || `Défi #${params.challengeId}`).slice(0, 80),
    category: cat,
    difficulty: diff,
    won: params.won,
    userPointsDelta: params.won ? params.userPointsDelta : actualDelta,
    countryDelta: params.countryDelta,
    countryCode: params.countryCode,
    rivalCode: params.rivalCode,
    mode: params.mode,
    timestamp: now,
  };

  profile.history = [entry, ...(profile.history || [])].slice(0, 80);
  profile.updatedAt = now;
  scheduleUsersSave();
  return profile;
}

// ==========================================
// SLIDING-WINDOW RATE LIMITER
// ==========================================
const ipRateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkIpRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = ipRateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    ipRateBuckets.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= maxRequests) {
    return false;
  }
  bucket.count += 1;
  return true;
}

// ==========================================
// AUTHORITATIVE SCORE MUTATION
// ==========================================
function sanitizePlayerName(raw: unknown): string {
  const str = String(raw ?? 'Joueur')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, 24);
  return str || 'Joueur';
}

function applyChallengeResult(params: {
  countryCode: string;
  rivalCode: string | null;
  challengeId: number;
  category: ChallengeCategory;
  won: boolean;
  timeLeftRatio: number;
  playerStreak: number;
  playerName: string;
}): { event: ScoreEvent; countryStanding: CountryStanding; rivalStanding: CountryStanding | null } {
  const {
    countryCode,
    rivalCode,
    challengeId,
    category,
    won,
    timeLeftRatio,
    playerStreak,
    playerName,
  } = params;

  const now = Date.now();
  const country = state.standings[countryCode];
  const validRivalCode =
    rivalCode && rivalCode !== countryCode && state.standings[rivalCode] ? rivalCode : null;
  const rival = validRivalCode ? state.standings[validRivalCode] : null;

  let countryDelta = 0;
  let rivalDelta = 0;

  if (won) {
    const clampedRatio = Math.max(0, Math.min(1, Number(timeLeftRatio) || 0));
    const speedBonus = Math.round(clampedRatio * 12);
    const streakBonus = Math.min(Math.max(0, Math.floor(playerStreak)), 6) * 3;
    const gain = 15 + speedBonus + streakBonus;

    country.points += gain;
    country.wins += 1;
    country.streak += 1;
    country.bestStreak = Math.max(country.bestStreak, country.streak);
    country.lastDelta = gain;
    country.updatedAt = now;
    countryDelta = gain;

    if (rival) {
      const prev = rival.points;
      rival.points = Math.max(0, rival.points - 8);
      rivalDelta = rival.points - prev;
      rival.lastDelta = rivalDelta;
      rival.updatedAt = now;
    }
  } else {
    const prev = country.points;
    country.points = Math.max(0, country.points - 15);
    countryDelta = country.points - prev;
    country.losses += 1;
    country.streak = 0;
    country.lastDelta = countryDelta === 0 ? -15 : countryDelta;
    country.updatedAt = now;

    if (rival) {
      rival.points += 10;
      rival.lastDelta = 10;
      rival.updatedAt = now;
      rivalDelta = 10;
    }
  }

  const event: ScoreEvent = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    playerName: sanitizePlayerName(playerName),
    countryCode,
    rivalCode: validRivalCode,
    challengeId: Math.max(1, Math.min(TOTAL_CHALLENGES, Math.floor(challengeId) || 1)),
    category: VALID_CATEGORIES.has(category) ? category : 'enigma',
    won,
    countryDelta,
    rivalDelta,
    timestamp: now,
  };

  state.recentEvents = [event, ...state.recentEvents].slice(0, 40);
  standingsDirty = true;
  scheduleSave();

  return { event, countryStanding: country, rivalStanding: rival };
}

// ==========================================
// LIVE MULTIPLAYER DUEL ENGINE (O(1) LOOKUPS)
// ==========================================
interface ConnectedClient {
  ws: WebSocket;
  clientId: string;
  userId: string | null;
  playerName: string;
  countryCode: string;
  roomId: string | null;
  isAlive: boolean;
  msgCount: number;
  msgWindowReset: number;
}

const clients = new Map<WebSocket, ConnectedClient>();
const clientsById = new Map<string, ConnectedClient>();
const duelQueue: string[] = [];
const duelQueueSet = new Set<string>();
const rooms = new Map<string, InternalRoom>(
  Object.entries(usersState.waitingRooms || {}).map(([id, r]) => [id, r])
);
const disconnectForfeitTimers = new Map<string, NodeJS.Timeout>();

const MAX_WS_BACKPRESSURE_BYTES = 256 * 1024;

function safeWsSend(ws: WebSocket, serialized: string) {
  if (ws.readyState === WebSocket.OPEN && ws.bufferedAmount < MAX_WS_BACKPRESSURE_BYTES) {
    ws.send(serialized);
  }
}

// Coalesced global broadcasts prevent O(N * updates) storms under heavy traffic
let standingsBroadcastTimer: NodeJS.Timeout | null = null;
let latestBroadcastEvent: ScoreEvent | null = null;
let presenceBroadcastTimer: NodeJS.Timeout | null = null;

function broadcastAllRaw(serialized: string) {
  for (const [ws] of clients) {
    safeWsSend(ws, serialized);
  }
}

function scheduleStandingsBroadcast(event?: ScoreEvent) {
  if (event) latestBroadcastEvent = event;
  if (standingsBroadcastTimer) return;
  standingsBroadcastTimer = setTimeout(() => {
    standingsBroadcastTimer = null;
    const payload = JSON.stringify({
      type: 'standings:update',
      standings: getSortedStandings(),
      event: latestBroadcastEvent,
      onlineCount: clients.size,
    });
    latestBroadcastEvent = null;
    broadcastAllRaw(payload);
  }, 350);
}

function schedulePresenceBroadcast() {
  if (presenceBroadcastTimer) return;
  presenceBroadcastTimer = setTimeout(() => {
    presenceBroadcastTimer = null;
    broadcastAllRaw(JSON.stringify({ type: 'presence', onlineCount: clients.size }));
  }, 1500);
}

function sendToClientId(clientId: string, payload: unknown) {
  const target = clientsById.get(clientId);
  if (target) {
    safeWsSend(target.ws, JSON.stringify(payload));
  }
}

function serializeRoom(room: InternalRoom): LiveDuelRoom {
  return {
    roomId: room.roomId,
    status: room.status,
    challengeIds: room.challengeIds,
    currentRound: room.currentRound,
    players: room.players,
    winnerClientId: room.winnerClientId,
    countryPointsAwarded: room.countryPointsAwarded,
    countryPointsLost: room.countryPointsLost,
  };
}

function broadcastRoom(room: InternalRoom) {
  const serialized = JSON.stringify({ type: 'duel:state', room: serializeRoom(room) });
  for (const p of room.players) {
    const target = clientsById.get(p.clientId);
    if (target) safeWsSend(target.ws, serialized);
  }
}

function generateDuelChallengeIds(): number[] {
  const ids = new Set<number>();
  while (ids.size < 5) {
    ids.add(Math.floor(Math.random() * TOTAL_CHALLENGES) + 1);
  }
  return Array.from(ids);
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 40; attempt++) {
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!rooms.has(code)) return code;
  }
  // Fallback to 6-char code if 4-char space is saturated under massive concurrency
  let fallback = '';
  for (let i = 0; i < 6; i++) {
    fallback += chars[Math.floor(Math.random() * chars.length)];
  }
  return fallback;
}

function removeFromQueue(clientId: string) {
  if (!duelQueueSet.has(clientId)) return;
  duelQueueSet.delete(clientId);
  const idx = duelQueue.indexOf(clientId);
  if (idx !== -1) duelQueue.splice(idx, 1);
}

function tryMatchmake() {
  while (duelQueue.length >= 2) {
    const idA = duelQueue.shift()!;
    duelQueueSet.delete(idA);
    const clientA = clientsById.get(idA);
    if (!clientA || clientA.roomId) continue;

    // Scan a bounded window to prefer pairing different countries in O(1) amortized time
    const searchLimit = Math.min(duelQueue.length, 30);
    let opponentIdx = -1;
    for (let i = 0; i < searchLimit; i++) {
      const candidate = clientsById.get(duelQueue[i]);
      if (candidate && !candidate.roomId && candidate.countryCode !== clientA.countryCode) {
        opponentIdx = i;
        break;
      }
    }
    if (opponentIdx === -1) opponentIdx = 0;

    const idB = duelQueue.splice(opponentIdx, 1)[0];
    duelQueueSet.delete(idB);
    const clientB = clientsById.get(idB);
    if (!clientB || clientB.roomId) {
      duelQueue.unshift(idA);
      duelQueueSet.add(idA);
      if (!clientB) continue;
      break;
    }

    const now = Date.now();
    const roomId = generateRoomCode();
    const room: InternalRoom = {
      roomId,
      status: 'playing',
      challengeIds: generateDuelChallengeIds(),
      currentRound: 0,
      players: [
        {
          clientId: clientA.clientId,
          playerName: clientA.playerName,
          countryCode: clientA.countryCode,
          roundScores: [],
          totalScore: 0,
          currentRoundDone: false,
          lastRoundCorrect: null,
        },
        {
          clientId: clientB.clientId,
          playerName: clientB.playerName,
          countryCode: clientB.countryCode,
          roundScores: [],
          totalScore: 0,
          currentRoundDone: false,
          lastRoundCorrect: null,
        },
      ],
      winnerClientId: null,
      countryPointsAwarded: 0,
      countryPointsLost: 0,
      createdAt: now,
      lastActivityAt: now,
    };

    rooms.set(roomId, room);
    clientA.roomId = roomId;
    clientB.roomId = roomId;
    broadcastRoom(room);
  }
}

function finishDuelRoom(room: InternalRoom) {
  room.status = 'finished';
  room.lastActivityAt = Date.now();
  const [p1, p2] = room.players;
  if (!p1 || !p2) return;

  let winner: DuelPlayerState | null = null;
  let loser: DuelPlayerState | null = null;

  if (p1.totalScore > p2.totalScore) {
    winner = p1;
    loser = p2;
  } else if (p2.totalScore > p1.totalScore) {
    winner = p2;
    loser = p1;
  }

  if (winner && loser) {
    room.winnerClientId = winner.clientId;
    const now = Date.now();
    const winStanding = state.standings[winner.countryCode];
    const loseStanding = state.standings[loser.countryCode];

    if (winStanding && winner.countryCode !== loser.countryCode) {
      winStanding.points += 60;
      winStanding.wins += 1;
      winStanding.streak += 1;
      winStanding.bestStreak = Math.max(winStanding.bestStreak, winStanding.streak);
      winStanding.lastDelta = 60;
      winStanding.updatedAt = now;
      room.countryPointsAwarded = 60;

      if (loseStanding) {
        const prev = loseStanding.points;
        loseStanding.points = Math.max(0, loseStanding.points - 35);
        const lost = prev - loseStanding.points;
        loseStanding.losses += 1;
        loseStanding.streak = 0;
        loseStanding.lastDelta = -35;
        loseStanding.updatedAt = now;
        room.countryPointsLost = lost || 35;
      }

      const evt: ScoreEvent = {
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        playerName: `${winner.playerName} vs ${loser.playerName}`,
        countryCode: winner.countryCode,
        rivalCode: loser.countryCode,
        challengeId: room.challengeIds[0],
        category: 'enigma',
        won: true,
        countryDelta: 60,
        rivalDelta: -35,
        timestamp: now,
      };
      state.recentEvents = [evt, ...state.recentEvents].slice(0, 40);
      standingsDirty = true;
      scheduleSave();
      scheduleStandingsBroadcast(evt);
    } else if (winStanding) {
      winStanding.points += 30;
      winStanding.wins += 1;
      winStanding.lastDelta = 30;
      winStanding.updatedAt = now;
      room.countryPointsAwarded = 30;
      standingsDirty = true;
      scheduleSave();
      scheduleStandingsBroadcast();
    }

    if (winner.userId) {
      const updatedWinner = recordUserOutcome({
        userId: winner.userId,
        challengeId: room.challengeIds[0],
        title: `Duel Live #${room.roomId} vs ${loser.playerName}`,
        category: 'enigma',
        difficulty: 'difficile',
        won: true,
        userPointsDelta: 60,
        countryDelta: room.countryPointsAwarded,
        countryCode: winner.countryCode,
        rivalCode: loser.countryCode,
        mode: 'duel',
      });
      if (updatedWinner) {
        sendToClientId(winner.clientId, { type: 'profile:update', profile: updatedWinner });
      }
    }
    if (loser.userId) {
      const updatedLoser = recordUserOutcome({
        userId: loser.userId,
        challengeId: room.challengeIds[0],
        title: `Duel Live #${room.roomId} vs ${winner.playerName}`,
        category: 'enigma',
        difficulty: 'difficile',
        won: false,
        userPointsDelta: -15,
        countryDelta: -room.countryPointsLost,
        countryCode: loser.countryCode,
        rivalCode: winner.countryCode,
        mode: 'duel',
      });
      if (updatedLoser) {
        sendToClientId(loser.clientId, { type: 'profile:update', profile: updatedLoser });
      }
    }
  } else {
    room.winnerClientId = null;
    for (const p of room.players) {
      if (p.userId) {
        const updated = recordUserOutcome({
          userId: p.userId,
          challengeId: room.challengeIds[0],
          title: `Duel Live #${room.roomId} (Égalité)`,
          category: 'enigma',
          difficulty: 'moyen',
          won: true,
          userPointsDelta: 15,
          countryDelta: 0,
          countryCode: p.countryCode,
          rivalCode: null,
          mode: 'duel',
        });
        if (updated) {
          sendToClientId(p.clientId, { type: 'profile:update', profile: updated });
        }
      }
    }
  }

  scheduleUsersSave();
  broadcastRoom(room);
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      uptimeSec: Math.round(process.uptime()),
      onlineCount: clients.size,
      activeRooms: rooms.size,
      queuedPlayers: duelQueue.length,
      totalChallenges: TOTAL_CHALLENGES,
      registeredUsers: Object.keys(usersState.users).length,
      sharedChallenges: Object.keys(usersState.sharedChallenges).length,
    });
  });

  app.get('/api/standings', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      standings: getSortedStandings(),
      recentEvents: state.recentEvents,
      onlineCount: clients.size,
      totalChallenges: TOTAL_CHALLENGES,
    });
  });

  // User Profile & Parcours API
  app.post('/api/profile/init', (req, res) => {
    const { userId, playerName, countryCode, rivalCode, localSnapshot } = req.body ?? {};
    const profile = getOrCreateUserProfile({
      userId,
      playerName,
      countryCode,
      rivalCode,
      localSnapshot,
    });
    res.json({ ok: true, profile });
  });

  app.post('/api/profile/sync-meta', (req, res) => {
    const validId = sanitizeUserId(req.body?.userId);
    if (!validId || !usersState.users[validId]) {
      res.status(404).json({ error: 'Profil introuvable.' });
      return;
    }
    const profile = usersState.users[validId];
    if (req.body.playerName) {
      profile.playerName = sanitizePlayerName(req.body.playerName);
    }
    if (typeof req.body.countryCode === 'string' && COUNTRY_MAP.has(req.body.countryCode)) {
      profile.countryCode = req.body.countryCode;
    }
    if (req.body.rivalCode === null || req.body.rivalCode === '') {
      profile.rivalCode = null;
    } else if (
      typeof req.body.rivalCode === 'string' &&
      req.body.rivalCode !== profile.countryCode &&
      COUNTRY_MAP.has(req.body.rivalCode)
    ) {
      profile.rivalCode = req.body.rivalCode;
    }
    profile.updatedAt = Date.now();
    scheduleUsersSave();
    res.json({ ok: true, profile });
  });

  app.post('/api/profile/restore', (req, res) => {
    const rawCode = String(req.body?.syncCode ?? '').trim().toUpperCase();
    const targetUserId = usersState.syncCodes[rawCode];
    if (!targetUserId || !usersState.users[targetUserId]) {
      res.status(404).json({ error: 'Code de sauvegarde introuvable. Vérifiez la saisie.' });
      return;
    }
    res.json({ ok: true, profile: usersState.users[targetUserId] });
  });

  // Shared Challenges API
  app.post('/api/shared-challenges', (req, res) => {
    const clientIp = req.ip || 'unknown';
    if (!checkIpRateLimit(clientIp, 60, 60_000)) {
      res.status(429).json({ error: 'Trop de partages rapprochés.' });
      return;
    }
    const {
      challengeId,
      userId,
      playerName = 'Champion',
      countryCode = 'FR',
      won = null,
      pointsDelta = 0,
    } = req.body ?? {};

    const cid = Math.max(1, Math.min(TOTAL_CHALLENGES, Math.floor(Number(challengeId) || 1)));
    const validCountry =
      typeof countryCode === 'string' && COUNTRY_MAP.has(countryCode) ? countryCode : 'FR';
    const shareId = generateShareId();

    const shared: SharedChallengeInfo = {
      shareId,
      challengeId: cid,
      creatorUserId: sanitizeUserId(userId) ?? 'anon',
      creatorName: sanitizePlayerName(playerName),
      creatorCountryCode: validCountry,
      creatorWon: typeof won === 'boolean' ? won : null,
      creatorPointsDelta: Math.round(Number(pointsDelta) || 0),
      attempts: [],
      createdAt: Date.now(),
    };

    usersState.sharedChallenges[shareId] = shared;
    scheduleUsersSave();
    res.json({ ok: true, sharedChallenge: shared });
  });

  app.get('/api/shared-challenges/:shareId', (req, res) => {
    const shareId = String(req.params.shareId || '').trim();
    const shared = usersState.sharedChallenges[shareId];
    if (!shared) {
      res.status(404).json({ error: 'Défi partagé expiré ou introuvable.' });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.json({ ok: true, sharedChallenge: shared });
  });

  app.post('/api/shared-challenges/:shareId/creator-outcome', (req, res) => {
    const shareId = String(req.params.shareId || '').trim();
    const shared = usersState.sharedChallenges[shareId];
    if (!shared) {
      res.status(404).json({ error: 'Défi introuvable.' });
      return;
    }
    const validId = sanitizeUserId(req.body?.userId);
    if (shared.creatorUserId === 'anon' || shared.creatorUserId === validId) {
      shared.creatorWon = Boolean(req.body?.won);
      shared.creatorPointsDelta = Math.round(Number(req.body?.pointsDelta) || 0);
      scheduleUsersSave();
    }
    res.json({ ok: true, sharedChallenge: shared });
  });

  app.get('/api/duel/:roomId', (req, res) => {
    const code = String(req.params.roomId || '').trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ ok: false, error: 'Salon introuvable.' });
      return;
    }
    res.json({ ok: true, room: serializeRoom(room) });
  });

  app.post('/api/score', (req, res) => {
    const clientIp = req.ip || 'unknown';
    if (!checkIpRateLimit(clientIp, 90, 60_000)) {
      res.status(429).json({ error: 'Trop de requêtes. Patientez quelques secondes.' });
      return;
    }

    const {
      userId,
      countryCode,
      rivalCode = null,
      challengeId,
      challengeTitle,
      category,
      difficulty = 'facile',
      won,
      timeLeftRatio = 0.5,
      playerStreak = 0,
      playerName = 'Joueur',
      mode = 'solo',
      shareId = null,
    } = req.body ?? {};

    if (typeof countryCode !== 'string' || !COUNTRY_MAP.has(countryCode)) {
      res.status(400).json({ error: 'Pays invalide.' });
      return;
    }

    const result = applyChallengeResult({
      countryCode,
      rivalCode: typeof rivalCode === 'string' ? rivalCode : null,
      challengeId: Number(challengeId) || 1,
      category: VALID_CATEGORIES.has(category) ? category : 'enigma',
      won: Boolean(won),
      timeLeftRatio: Number(timeLeftRatio) || 0,
      playerStreak: Number(playerStreak) || 0,
      playerName: String(playerName || 'Joueur'),
    });

    let updatedProfile: UserProfile | null = null;
    const validUserId = sanitizeUserId(userId);
    if (validUserId) {
      if (!usersState.users[validUserId]) {
        getOrCreateUserProfile({ userId: validUserId, playerName, countryCode, rivalCode });
      }
      updatedProfile = recordUserOutcome({
        userId: validUserId,
        challengeId: result.event.challengeId,
        title: String(challengeTitle || `Défi #${result.event.challengeId}`),
        category: result.event.category,
        difficulty: VALID_DIFFICULTIES.has(difficulty) ? difficulty : 'facile',
        won: result.event.won,
        userPointsDelta: result.event.countryDelta,
        countryDelta: result.event.countryDelta,
        countryCode,
        rivalCode: result.event.rivalCode,
        mode: mode === 'shared' ? 'shared' : 'solo',
      });
    }

    let updatedShared: SharedChallengeInfo | null = null;
    if (typeof shareId === 'string' && usersState.sharedChallenges[shareId]) {
      const shared = usersState.sharedChallenges[shareId];
      if (validUserId && shared.creatorUserId === validUserId) {
        shared.creatorWon = result.event.won;
        shared.creatorPointsDelta = result.event.countryDelta;
      } else {
        shared.attempts.unshift({
          playerName: result.event.playerName,
          countryCode,
          won: result.event.won,
          pointsDelta: result.event.countryDelta,
          timestamp: Date.now(),
        });
        shared.attempts = shared.attempts.slice(0, 30);
      }
      scheduleUsersSave();
      updatedShared = shared;
    }

    const sorted = getSortedStandings();
    scheduleStandingsBroadcast(result.event);

    res.json({
      ok: true,
      event: result.event,
      standings: sorted,
      profile: updatedProfile,
      sharedChallenge: updatedShared,
    });
  });

  app.get('/healthz', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  const distPath = path.join(__dirname, 'dist');
  const useProductionStatic =
    process.env.NODE_ENV === 'production' ||
    (process.env.npm_lifecycle_event === 'start' && fs.existsSync(distPath));

  if (useProductionStatic) {
    app.use(
      express.static(distPath, {
        maxAge: '1d',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 16 * 1024,
  });

  wss.on('connection', (ws) => {
    const clientId = `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const clientInfo: ConnectedClient = {
      ws,
      clientId,
      userId: null,
      playerName: 'Joueur',
      countryCode: 'FR',
      roomId: null,
      isAlive: true,
      msgCount: 0,
      msgWindowReset: Date.now() + 10_000,
    };
    clients.set(ws, clientInfo);
    clientsById.set(clientId, clientInfo);

    ws.on('pong', () => {
      clientInfo.isAlive = true;
    });

    safeWsSend(
      ws,
      JSON.stringify({
        type: 'init',
        clientId,
        standings: getSortedStandings(),
        recentEvents: state.recentEvents,
        onlineCount: clients.size,
      })
    );

    schedulePresenceBroadcast();

    const tryReattachPlayerInRoom = (roomId: string): InternalRoom | null => {
      if (!clientInfo.userId) return null;
      const room = rooms.get(roomId);
      if (!room) return null;
      const existingPlayer = room.players.find((p) => p.userId === clientInfo.userId);
      if (!existingPlayer) return null;

      const timerKey = `${roomId}:${clientInfo.userId}`;
      const pendingTimer = disconnectForfeitTimers.get(timerKey);
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        disconnectForfeitTimers.delete(timerKey);
      }

      const oldClientId = existingPlayer.clientId;
      existingPlayer.clientId = clientInfo.clientId;
      existingPlayer.playerName = clientInfo.playerName;
      existingPlayer.countryCode = clientInfo.countryCode;
      if (room.winnerClientId === oldClientId) {
        room.winnerClientId = clientInfo.clientId;
      }
      clientInfo.roomId = roomId;
      room.lastActivityAt = Date.now();
      return room;
    };

    ws.on('message', (raw) => {
      // Per-socket message rate limiting (max 40 msgs / 10s)
      const now = Date.now();
      if (now >= clientInfo.msgWindowReset) {
        clientInfo.msgCount = 0;
        clientInfo.msgWindowReset = now + 10_000;
      }
      clientInfo.msgCount += 1;
      if (clientInfo.msgCount > 40) return;

      try {
        const msg = JSON.parse(raw.toString());
        if (!msg || typeof msg.type !== 'string') return;

        if (msg.type === 'hello') {
          const validUid = sanitizeUserId(msg.userId);
          if (validUid) clientInfo.userId = validUid;
          if (msg.playerName) clientInfo.playerName = sanitizePlayerName(msg.playerName);
          if (typeof msg.countryCode === 'string' && COUNTRY_MAP.has(msg.countryCode)) {
            clientInfo.countryCode = msg.countryCode;
          }
          // Auto-reattach if user had an active/waiting room
          if (clientInfo.userId && !clientInfo.roomId) {
            for (const [rId, r] of rooms) {
              if (r.status !== 'finished' && r.players.some((p) => p.userId === clientInfo.userId)) {
                const reattached = tryReattachPlayerInRoom(rId);
                if (reattached) {
                  broadcastRoom(reattached);
                }
                break;
              }
            }
          }
        } else if (msg.type === 'duel:queue') {
          const validUid = sanitizeUserId(msg.userId);
          if (validUid) clientInfo.userId = validUid;
          if (msg.playerName) clientInfo.playerName = sanitizePlayerName(msg.playerName);
          if (typeof msg.countryCode === 'string' && COUNTRY_MAP.has(msg.countryCode)) {
            clientInfo.countryCode = msg.countryCode;
          }
          if (!duelQueueSet.has(clientInfo.clientId) && !clientInfo.roomId) {
            duelQueue.push(clientInfo.clientId);
            duelQueueSet.add(clientInfo.clientId);
            safeWsSend(
              ws,
              JSON.stringify({ type: 'duel:queued', position: duelQueue.length })
            );
            tryMatchmake();
          }
        } else if (msg.type === 'duel:cancel_queue') {
          removeFromQueue(clientInfo.clientId);
          safeWsSend(ws, JSON.stringify({ type: 'duel:queue_cancelled' }));
        } else if (msg.type === 'duel:create') {
          const validUid = sanitizeUserId(msg.userId);
          if (validUid) clientInfo.userId = validUid;
          if (msg.playerName) clientInfo.playerName = sanitizePlayerName(msg.playerName);
          if (typeof msg.countryCode === 'string' && COUNTRY_MAP.has(msg.countryCode)) {
            clientInfo.countryCode = msg.countryCode;
          }
          if (clientInfo.roomId) {
            const cur = rooms.get(clientInfo.roomId);
            if (cur && cur.status !== 'finished') {
              broadcastRoom(cur);
              return;
            }
            clientInfo.roomId = null;
          }
          removeFromQueue(clientInfo.clientId);
          const roomId = generateRoomCode();
          const room: InternalRoom = {
            roomId,
            status: 'waiting',
            challengeIds: generateDuelChallengeIds(),
            currentRound: 0,
            players: [
              {
                clientId: clientInfo.clientId,
                userId: clientInfo.userId ?? undefined,
                playerName: clientInfo.playerName,
                countryCode: clientInfo.countryCode,
                roundScores: [],
                totalScore: 0,
                currentRoundDone: false,
                lastRoundCorrect: null,
              },
            ],
            winnerClientId: null,
            countryPointsAwarded: 0,
            countryPointsLost: 0,
            createdAt: now,
            lastActivityAt: now,
          };
          rooms.set(roomId, room);
          clientInfo.roomId = roomId;
          scheduleUsersSave();
          broadcastRoom(room);
        } else if (msg.type === 'duel:join') {
          const validUid = sanitizeUserId(msg.userId);
          if (validUid) clientInfo.userId = validUid;
          if (msg.playerName) clientInfo.playerName = sanitizePlayerName(msg.playerName);
          if (typeof msg.countryCode === 'string' && COUNTRY_MAP.has(msg.countryCode)) {
            clientInfo.countryCode = msg.countryCode;
          }

          const code = String(msg.roomId || '').trim().toUpperCase();
          const room = rooms.get(code);
          if (!room) {
            sendToClientId(clientInfo.clientId, {
              type: 'duel:error',
              error: 'Salon introuvable ou expiré. Créez un nouveau salon.',
            });
            return;
          }

          // Allow creator or participant to reattach cleanly by userId
          const reattached = tryReattachPlayerInRoom(code);
          if (reattached) {
            broadcastRoom(reattached);
            return;
          }

          if (clientInfo.roomId && clientInfo.roomId !== code) {
            // Detach from any old waiting/finished room before joining the shared room
            const oldRoom = rooms.get(clientInfo.roomId);
            if (oldRoom && oldRoom.status === 'waiting') {
              oldRoom.players = oldRoom.players.filter((p) => p.clientId !== clientInfo.clientId);
              if (oldRoom.players.length === 0) rooms.delete(clientInfo.roomId);
            }
            clientInfo.roomId = null;
          }

          if (room.players.length >= 2) {
            sendToClientId(clientInfo.clientId, {
              type: 'duel:error',
              error: 'Ce salon est déjà complet.',
            });
            return;
          }
          removeFromQueue(clientInfo.clientId);
          room.players.push({
            clientId: clientInfo.clientId,
            userId: clientInfo.userId ?? undefined,
            playerName: clientInfo.playerName,
            countryCode: clientInfo.countryCode,
            roundScores: [],
            totalScore: 0,
            currentRoundDone: false,
            lastRoundCorrect: null,
          });
          room.status = 'playing';
          room.lastActivityAt = now;
          clientInfo.roomId = code;
          scheduleUsersSave();
          broadcastRoom(room);
        } else if (msg.type === 'duel:round_submit') {
          const room = rooms.get(String(msg.roomId || ''));
          if (!room || room.status !== 'playing') return;
          if (msg.roundIndex !== room.currentRound) return;

          const player = room.players.find((p) => p.clientId === clientInfo.clientId);
          if (!player || player.currentRoundDone) return;

          const won = Boolean(msg.won);
          const ratio = Math.max(0, Math.min(1, Number(msg.timeLeftRatio) || 0));
          const roundPts = won ? Math.round(100 + ratio * 50) : 0;

          player.currentRoundDone = true;
          player.lastRoundCorrect = won;
          player.roundScores.push(roundPts);
          player.totalScore += roundPts;
          room.lastActivityAt = now;

          if (room.players.every((p) => p.currentRoundDone)) {
            if (room.currentRound + 1 >= room.challengeIds.length) {
              finishDuelRoom(room);
            } else {
              room.currentRound += 1;
              for (const p of room.players) {
                p.currentRoundDone = false;
              }
              broadcastRoom(room);
            }
          } else {
            broadcastRoom(room);
          }
        } else if (msg.type === 'duel:leave') {
          const rId = clientInfo.roomId;
          clientInfo.roomId = null;
          if (rId) {
            const room = rooms.get(rId);
            if (room) {
              room.players = room.players.filter((p) => p.clientId !== clientInfo.clientId);
              room.lastActivityAt = now;
              if (room.players.length === 0) {
                rooms.delete(rId);
                scheduleUsersSave();
              } else if (room.status === 'playing') {
                room.status = 'finished';
                room.winnerClientId = room.players[0].clientId;
                broadcastRoom(room);
              }
            }
          }
        }
      } catch {
        // Ignore malformed WS packets
      }
    });

    ws.on('close', () => {
      removeFromQueue(clientInfo.clientId);

      if (clientInfo.roomId) {
        const roomId = clientInfo.roomId;
        const room = rooms.get(roomId);
        if (room) {
          if (room.status === 'waiting') {
            // Keep waiting room alive so the shared link/code stays valid while host shares it!
            room.lastActivityAt = Date.now();
          } else if (room.status === 'playing') {
            // Give a 20s grace period for mobile/tab switches before awarding forfeit
            const graceKey = clientInfo.userId ? `${roomId}:${clientInfo.userId}` : `${roomId}:${clientInfo.clientId}`;
            const timer = setTimeout(() => {
              disconnectForfeitTimers.delete(graceKey);
              const targetRoom = rooms.get(roomId);
              if (!targetRoom || targetRoom.status !== 'playing') return;
              targetRoom.players = targetRoom.players.filter((p) => p.clientId !== clientInfo.clientId);
              targetRoom.lastActivityAt = Date.now();
              if (targetRoom.players.length === 0) {
                rooms.delete(roomId);
              } else {
                targetRoom.status = 'finished';
                targetRoom.winnerClientId = targetRoom.players[0].clientId;
                broadcastRoom(targetRoom);
              }
            }, 20_000);
            disconnectForfeitTimers.set(graceKey, timer);
          }
        }
      }

      clients.delete(ws);
      clientsById.delete(clientId);
      schedulePresenceBroadcast();
    });
  });

  // Periodic maintenance: WebSocket heartbeat, room GC, shared challenge & rate-limiter cleanup
  const maintenanceInterval = setInterval(() => {
    const now = Date.now();

    // 1. Terminate dead/half-open WebSocket connections
    for (const [ws, info] of clients) {
      if (!info.isAlive) {
        ws.terminate();
        continue;
      }
      info.isAlive = false;
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }

    // 2. Garbage-collect stale duel rooms
    let removedWaitingRoom = false;
    for (const [roomId, room] of rooms) {
      const idleMs = now - room.lastActivityAt;
      if (
        (room.status === 'finished' && idleMs > 5 * 60_000) ||
        (room.status === 'waiting' && idleMs > 20 * 60_000) ||
        idleMs > 45 * 60_000
      ) {
        if (room.status === 'waiting') removedWaitingRoom = true;
        for (const p of room.players) {
          const c = clientsById.get(p.clientId);
          if (c && c.roomId === roomId) c.roomId = null;
        }
        rooms.delete(roomId);
      }
    }
    if (removedWaitingRoom) scheduleUsersSave();

    // 3. Prune expired IP rate-limit buckets
    for (const [ip, bucket] of ipRateBuckets) {
      if (now >= bucket.resetAt) {
        ipRateBuckets.delete(ip);
      }
    }
  }, 30_000);

  const shutdown = () => {
    clearInterval(maintenanceInterval);
    flushSaveSync();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Quiz server listening on http://localhost:${PORT}`);
  });
}

startServer();

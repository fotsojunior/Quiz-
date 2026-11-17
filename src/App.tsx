import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArenaView } from './components/ArenaView';
import { CatalogView } from './components/CatalogView';
import { ChallengeOutcome } from './components/ChallengeRunner';
import { CountryPickerModal } from './components/CountryPickerModal';
import { AppTab, Header } from './components/Header';
import { LeaderboardView } from './components/LeaderboardView';
import { LiveDuelView } from './components/LiveDuelView';
import { ParcoursView } from './components/ParcoursView';
import {
  TOTAL_CHALLENGES,
  getChallengeById,
  getDifficultyTierForProgress,
  getTimeLimitForProgress,
  pickRandomChallengeId,
} from './data/challengesGenerator';
import { COUNTRIES, COUNTRY_MAP, getCountry } from './data/countries';
import { useFirebase } from './contexts/FirebaseContext';
import {
  ensureOrMergeFirestoreProfile,
  recordOutcomeToFirestore,
  saveSharedChallengeToFirestore,
  subscribeToFirestoreHistory,
  syncProfileMetaToFirestore,
} from './services/firestoreProfile';
import {
  createFirestoreDuelRoom,
  joinFirestoreDuelRoom,
  submitFirestoreDuelRound,
  subscribeFirestoreDuelRoom,
} from './services/firestoreDuel';
import {
  Challenge,
  ChallengeCategory,
  CountryStanding,
  Difficulty,
  LiveDuelRoom,
  ScoreEvent,
  SharedChallengeInfo,
  UserHistoryEntry,
  UserProfile,
} from './types/game';
import { buildChallengeShareUrl, shareOrCopyLink } from './utils/share';
import { soundFX } from './utils/sound';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

function apiUrl(path: string): string {
  return API_BASE ? `${API_BASE}${path}` : path;
}

async function fetchJsonSafe<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(apiUrl(path), init);
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const STORAGE_KEYS = {
  userId: 'nd_user_id',
  profile: 'nd_user_profile',
  country: 'nd_country_code',
  rival: 'nd_rival_code',
  name: 'nd_player_name',
  solved: 'nd_solved_ids',
  answered: 'nd_answered_count',
  standings: 'nd_standings',
  events: 'nd_recent_events',
};

function safeStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota or private-mode security errors
  }
}

function createFallbackStandings(): CountryStanding[] {
  const now = Date.now();
  return COUNTRIES.map((c) => ({
    code: c.code,
    points: 1000,
    wins: 0,
    losses: 0,
    streak: 0,
    bestStreak: 0,
    lastDelta: 0,
    updatedAt: now,
  }));
}

function loadInitialStandings(): CountryStanding[] {
  try {
    const raw = safeStorageGet(STORAGE_KEYS.standings);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 100 && typeof parsed[0]?.code === 'string') {
        return parsed as CountryStanding[];
      }
    }
  } catch {
    // Fallback below
  }
  return createFallbackStandings();
}

function loadInitialEvents(): ScoreEvent[] {
  try {
    const raw = safeStorageGet(STORAGE_KEYS.events);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, 40) as ScoreEvent[];
    }
  } catch {
    // Fallback below
  }
  return [];
}

function createEmptyProfile(params: {
  userId: string;
  playerName: string;
  countryCode: string;
  rivalCode: string | null;
  answeredCount: number;
  solvedIds: number[];
}): UserProfile {
  const now = Date.now();
  return {
    userId: params.userId,
    syncCode: 'LOCAL',
    playerName: params.playerName,
    countryCode: params.countryCode,
    rivalCode: params.rivalCode,
    userPoints: params.solvedIds.length * 20,
    wins: params.solvedIds.length,
    losses: 0,
    currentStreak: 0,
    bestStreak: 0,
    answeredCount: params.answeredCount,
    solvedIds: params.solvedIds,
    categoryStats: {
      enigma: { played: 0, won: 0, points: 0 },
      logic: { played: 0, won: 0, points: 0 },
      focus: { played: 0, won: 0, points: 0 },
      speed: { played: 0, won: 0, points: 0 },
      creation: { played: 0, won: 0, points: 0 },
      riddle: { played: 0, won: 0, points: 0 },
    },
    history: [],
    createdAt: now,
    updatedAt: now,
  };
}

function parseInitialUrlIntent(): {
  roomCode: string | null;
  sharedChallengeId: number | null;
  shareId: string | null;
  byName: string | null;
  byCountry: string | null;
  creatorWon: boolean | null;
  creatorPointsDelta: number;
} {
  try {
    const params = new URLSearchParams(window.location.search);
    const rawRoom = params.get('room')?.trim().toUpperCase() || null;
    const rawChallenge = params.get('defi') ?? params.get('challenge');
    const parsedChallenge = rawChallenge ? Math.floor(Number(rawChallenge)) : NaN;
    const sharedChallengeId =
      Number.isFinite(parsedChallenge) &&
      parsedChallenge >= 1 &&
      parsedChallenge <= TOTAL_CHALLENGES
        ? parsedChallenge
        : null;
    const shareId = params.get('share')?.trim() || null;
    const byName = params.get('by')?.trim().slice(0, 24) || null;
    const rawPays = params.get('pays')?.trim().toUpperCase() || null;
    const byCountry = rawPays && COUNTRY_MAP.has(rawPays) ? rawPays : null;
    const rawWon = params.get('won');
    const creatorWon = rawWon === '1' ? true : rawWon === '0' ? false : null;
    const rawPts = Number(params.get('pts'));
    const creatorPointsDelta = Number.isFinite(rawPts) ? Math.round(rawPts) : 0;

    return {
      roomCode: rawRoom,
      sharedChallengeId,
      shareId,
      byName,
      byCountry,
      creatorWon,
      creatorPointsDelta,
    };
  } catch {
    return {
      roomCode: null,
      sharedChallengeId: null,
      shareId: null,
      byName: null,
      byCountry: null,
      creatorWon: null,
      creatorPointsDelta: 0,
    };
  }
}

function clearShareUrlParams() {
  try {
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  } catch {
    // Ignore history API errors
  }
}

export default function App() {
  const initialIntent = useMemo(() => parseInitialUrlIntent(), []);
  const {
    authUser,
    authReady,
    isSigningIn,
    authError,
    signInWithGoogle,
    signOutGoogle,
    clearAuthError,
  } = useFirebase();
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);
  if (firestoreError) {
    throw firestoreError;
  }

  const [activeTab, setActiveTab] = useState<AppTab>(() =>
    initialIntent.roomCode ? 'duel' : 'arena'
  );

  const [myCountryCode, setMyCountryCode] = useState<string>(() => {
    return safeStorageGet(STORAGE_KEYS.country) || 'FR';
  });
  const [rivalCountryCode, setRivalCountryCode] = useState<string | null>(() => {
    if (
      initialIntent.byCountry &&
      initialIntent.byCountry !== (safeStorageGet(STORAGE_KEYS.country) || 'FR')
    ) {
      return initialIntent.byCountry;
    }
    const saved = safeStorageGet(STORAGE_KEYS.rival);
    return saved === '' ? null : saved || 'BR';
  });
  const [playerName, setPlayerName] = useState<string>(() => {
    return safeStorageGet(STORAGE_KEYS.name) || 'Champion';
  });
  const [solvedIds, setSolvedIds] = useState<number[]>(() => {
    try {
      const raw = safeStorageGet(STORAGE_KEYS.solved);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((id): id is number => typeof id === 'number' && Number.isFinite(id))
        : [];
    } catch {
      return [];
    }
  });

  const [answeredCount, setAnsweredCount] = useState<number>(() => {
    const raw = Number(safeStorageGet(STORAGE_KEYS.answered));
    return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const raw = safeStorageGet(STORAGE_KEYS.profile);
      if (raw) {
        const parsed = JSON.parse(raw) as UserProfile;
        if (parsed && typeof parsed.userId === 'string') return parsed;
      }
    } catch {
      // Fallback to empty profile below
    }
    const fallbackId =
      safeStorageGet(STORAGE_KEYS.userId) ||
      `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const savedAnswered = Number(safeStorageGet(STORAGE_KEYS.answered)) || 0;
    let savedSolved: number[] = [];
    try {
      const rawSolved = safeStorageGet(STORAGE_KEYS.solved);
      if (rawSolved) savedSolved = JSON.parse(rawSolved);
    } catch {
      savedSolved = [];
    }
    return createEmptyProfile({
      userId: fallbackId,
      playerName: safeStorageGet(STORAGE_KEYS.name) || 'Champion',
      countryCode: safeStorageGet(STORAGE_KEYS.country) || 'FR',
      rivalCode: safeStorageGet(STORAGE_KEYS.rival) || 'BR',
      answeredCount: savedAnswered,
      solvedIds: Array.isArray(savedSolved) ? savedSolved : [],
    });
  });

  const [sharedChallengeContext, setSharedChallengeContext] = useState<{
    challengeId: number;
    shareId: string | null;
    creatorName: string;
    creatorCountryCode: string;
    info: SharedChallengeInfo | null;
  } | null>(() => {
    if (!initialIntent.sharedChallengeId) return null;
    const hasUrlOutcome = initialIntent.creatorWon !== null;
    return {
      challengeId: initialIntent.sharedChallengeId,
      shareId: initialIntent.shareId,
      creatorName: initialIntent.byName || 'Un ami',
      creatorCountryCode: initialIntent.byCountry || 'FR',
      info: hasUrlOutcome
        ? {
            shareId: initialIntent.shareId || 'url',
            challengeId: initialIntent.sharedChallengeId,
            creatorUserId: '',
            creatorName: initialIntent.byName || 'Un ami',
            creatorCountryCode: initialIntent.byCountry || 'FR',
            creatorWon: initialIntent.creatorWon,
            creatorPointsDelta: initialIntent.creatorPointsDelta,
            attempts: [],
            createdAt: Date.now(),
          }
        : null,
    };
  });

  const [standings, setStandings] = useState<CountryStanding[]>(loadInitialStandings);
  const [recentEvents, setRecentEvents] = useState<ScoreEvent[]>(loadInitialEvents);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<ChallengeCategory | 'all'>(() => {
    if (initialIntent.sharedChallengeId) {
      return getChallengeById(initialIntent.sharedChallengeId).category;
    }
    return 'all';
  });
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(() => {
    const initialAnswered = Number(safeStorageGet(STORAGE_KEYS.answered));
    const safeAnswered =
      Number.isFinite(initialAnswered) && initialAnswered >= 0
        ? Math.floor(initialAnswered)
        : 0;
    if (initialIntent.sharedChallengeId) {
      return getChallengeById(initialIntent.sharedChallengeId, safeAnswered);
    }
    return getChallengeById(
      pickRandomChallengeId('all', new Set(), safeAnswered),
      safeAnswered
    );
  });
  const [playerStreak, setPlayerStreak] = useState<number>(0);
  const [lastServerDelta, setLastServerDelta] = useState<{
    countryDelta: number;
    rivalDelta: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [pickerMode, setPickerMode] = useState<'player' | 'rival' | null>(null);
  const [shareToastUrl, setShareToastUrl] = useState<string | null>(null);

  // Live Multiplayer Duel WebSocket state & resilience refs
  const wsRef = useRef<WebSocket | null>(null);
  const pendingRoomJoinRef = useRef<string | null>(initialIntent.roomCode);
  const profileInitializedRef = useRef<boolean>(false);
  const firebaseSyncedUidRef = useRef<string | null>(null);
  const lastRecordedHistoryIdRef = useRef<string | null>(null);
  const authUserRef = useRef(authUser);
  authUserRef.current = authUser;
  const userProfileRef = useRef(userProfile);
  userProfileRef.current = userProfile;
  const latestProfileRef = useRef({
    userId: userProfile.userId,
    playerName,
    myCountryCode,
  });
  latestProfileRef.current = {
    userId: userProfile.userId,
    playerName,
    myCountryCode,
  };

  const submittingLockRef = useRef<boolean>(false);
  const challengeSubmittedRef = useRef<boolean>(false);

  const [clientId, setClientId] = useState<string | null>(null);
  const [isQueued, setIsQueued] = useState(false);
  const [duelRoom, setDuelRoom] = useState<LiveDuelRoom | null>(null);
  const [duelError, setDuelError] = useState<string | null>(null);
  const [duelTransport, setDuelTransport] = useState<'ws' | 'firestore' | 'local' | null>(null);
  const firestoreDuelUnsubRef = useRef<(() => void) | null>(null);
  const localDuelBotTimerRef = useRef<number | null>(null);
  const finalizedDuelRoomRef = useRef<string | null>(null);

  const applyServerProfile = useCallback(
    (profile: UserProfile, syncMetaToo = false) => {
      setUserProfile(profile);
      safeStorageSet(STORAGE_KEYS.userId, profile.userId);
      safeStorageSet(STORAGE_KEYS.profile, JSON.stringify(profile));
      setAnsweredCount(profile.answeredCount);
      setSolvedIds(profile.solvedIds);
      setPlayerStreak(profile.currentStreak);
      if (syncMetaToo) {
        setPlayerName(profile.playerName);
        setMyCountryCode(profile.countryCode);
        if (!initialIntent.byCountry) {
          setRivalCountryCode(profile.rivalCode);
        }
      }
    },
    [initialIntent.byCountry]
  );

  // Persist user profile choices safely
  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.country, myCountryCode);
  }, [myCountryCode]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.rival, rivalCountryCode ?? '');
  }, [rivalCountryCode]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.name, playerName);
  }, [playerName]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.solved, JSON.stringify(solvedIds.slice(-1500)));
  }, [solvedIds]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.answered, String(answeredCount));
  }, [answeredCount]);

  // Initialize / hydrate authoritative UserProfile from server (if Express backend exists)
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 5000);
    const savedId = safeStorageGet(STORAGE_KEYS.userId);

    fetchJsonSafe<{ ok?: boolean }>('/api/health', { signal: controller.signal })
      .then((health) => {
        const hasBackend = Boolean(health?.ok);
        setBackendAvailable(hasBackend);
        if (!hasBackend) return null;
        return fetchJsonSafe<{ profile?: UserProfile }>('/api/profile/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            userId: userProfile.userId,
            playerName,
            countryCode: myCountryCode,
            rivalCode: rivalCountryCode,
            localSnapshot: {
              answeredCount,
              solvedIds,
              userPoints: userProfile.userPoints,
              wins: userProfile.wins,
              losses: userProfile.losses,
              bestStreak: userProfile.bestStreak,
            },
          }),
        });
      })
      .then((data) => {
        if (data?.profile) {
          applyServerProfile(data.profile, Boolean(savedId));
          profileInitializedRef.current = true;
        }
      })
      .catch(() => {
        setBackendAvailable(false);
      })
      .finally(() => {
        window.clearTimeout(timer);
      });

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // Run once on startup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate & merge user profile with Cloud Firestore when authenticated via Google
  useEffect(() => {
    if (!authReady || !authUser) {
      firebaseSyncedUidRef.current = null;
      return;
    }

    let cancelled = false;
    const baseProfile = userProfileRef.current;
    const seedProfile: UserProfile =
      baseProfile.playerName === 'Champion' && authUser.displayName
        ? { ...baseProfile, playerName: authUser.displayName.trim().slice(0, 24) || 'Champion' }
        : baseProfile;

    ensureOrMergeFirestoreProfile(authUser.uid, seedProfile)
      .then((merged) => {
        if (cancelled) return;
        firebaseSyncedUidRef.current = authUser.uid;
        applyServerProfile(merged, true);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof Error && err.message.includes('operationType')) {
          setFirestoreError(err);
        }
      });

    const unsubscribeHistory = subscribeToFirestoreHistory(authUser.uid, (cloudHistory) => {
      if (cancelled) return;
      setUserProfile((prev) => {
        const mergedMap = new Map<string, UserHistoryEntry>();
        const dedupKey = (item: UserHistoryEntry) =>
          `${item.challengeId}_${item.timestamp}_${item.mode}`;
        for (const item of cloudHistory) mergedMap.set(dedupKey(item), item);
        for (const item of prev.history || []) {
          const k = dedupKey(item);
          if (!mergedMap.has(k)) mergedMap.set(k, item);
        }
        const combined = Array.from(mergedMap.values())
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 80);
        const updated = { ...prev, history: combined };
        safeStorageSet(STORAGE_KEYS.profile, JSON.stringify(updated));
        return updated;
      });
    });

    return () => {
      cancelled = true;
      unsubscribeHistory();
    };
  }, [authReady, authUser, applyServerProfile]);

  // Fetch shared challenge metadata if opened via ?share=...
  useEffect(() => {
    if (!initialIntent.shareId) return;
    fetchJsonSafe<{ sharedChallenge?: SharedChallengeInfo }>(
      `/api/shared-challenges/${encodeURIComponent(initialIntent.shareId)}`
    )
      .then((data) => {
        if (data?.sharedChallenge) {
          const sc = data.sharedChallenge;
          setSharedChallengeContext({
            challengeId: sc.challengeId,
            shareId: sc.shareId,
            creatorName: sc.creatorName,
            creatorCountryCode: sc.creatorCountryCode,
            info: sc,
          });
          setActiveChallenge(getChallengeById(sc.challengeId, answeredCount));
          setSelectedCategory(getChallengeById(sc.challengeId).category);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial HTTP fetch for immediate hydration when backend is available
  useEffect(() => {
    if (backendAvailable !== true) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 6000);

    fetchJsonSafe<{
      standings?: CountryStanding[];
      recentEvents?: ScoreEvent[];
      onlineCount?: number;
    }>('/api/standings', { signal: controller.signal })
      .then((data) => {
        if (data?.standings) {
          setStandings(data.standings);
          safeStorageSet(STORAGE_KEYS.standings, JSON.stringify(data.standings));
        }
        if (data?.recentEvents) {
          setRecentEvents(data.recentEvents);
          safeStorageSet(STORAGE_KEYS.events, JSON.stringify(data.recentEvents));
        }
        if (typeof data?.onlineCount === 'number') setOnlineCount(data.onlineCount);
      })
      .catch(() => {})
      .finally(() => {
        window.clearTimeout(timer);
      });

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [backendAvailable]);

  // Real-time WebSocket connection (only when Express/WS backend is detected)
  useEffect(() => {
    if (backendAvailable !== true) return;
    let alive = true;
    let reconnectTimer: number | null = null;
    let reconnectAttempt = 0;

    function clearReconnectTimer() {
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    }

    function connect() {
      if (!alive) return;
      const existing = wsRef.current;
      if (
        existing &&
        (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      clearReconnectTimer();
      let wsEndpoint: string;
      if (API_BASE) {
        const parsed = new URL(API_BASE);
        const proto = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
        wsEndpoint = `${proto}//${parsed.host}/ws`;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsEndpoint = `${protocol}//${window.location.host}/ws`;
      }
      const ws = new WebSocket(wsEndpoint);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempt = 0;
        const { userId, playerName: currentName, myCountryCode: currentCountry } =
          latestProfileRef.current;
        ws.send(
          JSON.stringify({
            type: 'hello',
            userId: userId || undefined,
            playerName: currentName,
            countryCode: currentCountry,
          })
        );
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'init') {
            setClientId(msg.clientId);
            if (msg.standings) setStandings(msg.standings);
            if (msg.recentEvents) setRecentEvents(msg.recentEvents);
            if (typeof msg.onlineCount === 'number') setOnlineCount(msg.onlineCount);

            if (pendingRoomJoinRef.current) {
              const targetRoom = pendingRoomJoinRef.current;
              const { userId, playerName: currentName, myCountryCode: currentCountry } =
                latestProfileRef.current;
              ws.send(
                JSON.stringify({
                  type: 'duel:join',
                  roomId: targetRoom,
                  userId: userId || undefined,
                  playerName: currentName,
                  countryCode: currentCountry,
                })
              );
              pendingRoomJoinRef.current = null;
            }
          } else if (msg.type === 'presence') {
            if (typeof msg.onlineCount === 'number') setOnlineCount(msg.onlineCount);
          } else if (msg.type === 'standings:update') {
            if (msg.standings) setStandings(msg.standings);
            if (msg.event) {
              setRecentEvents((prev) => {
                if (prev.some((e) => e.id === msg.event.id)) return prev;
                return [msg.event, ...prev].slice(0, 40);
              });
            }
            if (typeof msg.onlineCount === 'number') setOnlineCount(msg.onlineCount);
          } else if (msg.type === 'profile:update') {
            if (msg.profile) {
              applyServerProfile(msg.profile, false);
              const latestEntry = msg.profile.history?.[0] as UserHistoryEntry | undefined;
              const currentAuth = authUserRef.current;
              if (
                currentAuth &&
                firebaseSyncedUidRef.current === currentAuth.uid &&
                latestEntry &&
                latestEntry.id !== lastRecordedHistoryIdRef.current
              ) {
                lastRecordedHistoryIdRef.current = latestEntry.id;
                void recordOutcomeToFirestore(currentAuth.uid, msg.profile, latestEntry).catch(
                  (err) => {
                    if (err instanceof Error && err.message.includes('operationType')) {
                      setFirestoreError(err);
                    }
                  }
                );
              }
            }
          } else if (msg.type === 'duel:queued') {
            setIsQueued(true);
            setDuelError(null);
          } else if (msg.type === 'duel:queue_cancelled') {
            setIsQueued(false);
          } else if (msg.type === 'duel:state') {
            setIsQueued(false);
            setDuelError(null);
            setDuelRoom(msg.room);
          } else if (msg.type === 'duel:error') {
            setDuelError(msg.error || 'Erreur de duel.');
          }
        } catch {
          // Ignore malformed WS payloads
        }
      };

      ws.onerror = () => {
        // Handled cleanly by onclose backoff
      };

      ws.onclose = () => {
        if (!alive) return;
        const expDelay = Math.min(30000, 1000 * 2 ** reconnectAttempt);
        const jitter = Math.floor(Math.random() * 1000);
        reconnectAttempt = Math.min(reconnectAttempt + 1, 6);
        clearReconnectTimer();
        reconnectTimer = window.setTimeout(connect, expDelay + jitter);
      };
    }

    const handleOnline = () => {
      reconnectAttempt = 0;
      connect();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const ws = wsRef.current;
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          reconnectAttempt = 0;
          connect();
        }
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    connect();

    return () => {
      alive = false;
      clearReconnectTimer();
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      wsRef.current?.close();
    };
  }, [backendAvailable]);

  // Keep WS & server profile metadata synced when user changes country, rival, or name
  useEffect(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'hello',
          userId: userProfile.userId || undefined,
          playerName,
          countryCode: myCountryCode,
        })
      );
    }

    const syncTimer = window.setTimeout(() => {
      if (backendAvailable === true && profileInitializedRef.current && userProfile.userId) {
        fetchJsonSafe<{ profile?: UserProfile }>('/api/profile/sync-meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userProfile.userId,
            playerName,
            countryCode: myCountryCode,
            rivalCode: rivalCountryCode,
          }),
        })
          .then((data) => {
            if (data?.profile) {
              setUserProfile(data.profile);
              safeStorageSet(STORAGE_KEYS.profile, JSON.stringify(data.profile));
            }
          })
          .catch(() => {});
      }

      if (authUser && firebaseSyncedUidRef.current === authUser.uid) {
        void syncProfileMetaToFirestore(authUser.uid, {
          syncCode: userProfile.syncCode,
          playerName,
          countryCode: myCountryCode,
          rivalCode: rivalCountryCode,
        }).catch((err) => {
          if (err instanceof Error && err.message.includes('operationType')) {
            setFirestoreError(err);
          }
        });
      }
    }, 350);

    return () => window.clearTimeout(syncTimer);
  }, [
    authUser,
    backendAvailable,
    myCountryCode,
    playerName,
    rivalCountryCode,
    userProfile.syncCode,
    userProfile.userId,
  ]);

  const standingsMap = useMemo(
    () => new Map(standings.map((s) => [s.code, s])),
    [standings]
  );

  const rankMap = useMemo(() => {
    const sorted = [...standings].sort(
      (a, b) => b.points - a.points || b.wins - a.wins || a.code.localeCompare(b.code)
    );
    return new Map(sorted.map((s, idx) => [s.code, idx + 1]));
  }, [standings]);

  const sortedStandings = useMemo(
    () =>
      [...standings].sort(
        (a, b) => b.points - a.points || b.wins - a.wins || a.code.localeCompare(b.code)
      ),
    [standings]
  );

  const myCountry = getCountry(myCountryCode);
  const myStanding = standingsMap.get(myCountryCode);
  const myRank = rankMap.get(myCountryCode) ?? 1;

  const effectiveRivalCode =
    rivalCountryCode && rivalCountryCode !== myCountryCode ? rivalCountryCode : null;
  const rivalCountry = effectiveRivalCode ? getCountry(effectiveRivalCode) : null;
  const rivalStanding = effectiveRivalCode ? standingsMap.get(effectiveRivalCode) : undefined;
  const rivalRank = effectiveRivalCode ? rankMap.get(effectiveRivalCode) ?? null : null;

  const solvedSet = useMemo(() => new Set(solvedIds), [solvedIds]);

  const startNewChallenge = useCallback(
    (overrideCategory?: ChallengeCategory | 'all') => {
      const cat = overrideCategory ?? selectedCategory;
      if (overrideCategory) setSelectedCategory(overrideCategory);
      const id = pickRandomChallengeId(cat, solvedSet, answeredCount);
      challengeSubmittedRef.current = false;
      setSharedChallengeContext(null);
      clearShareUrlParams();
      setLastServerDelta(null);
      setActiveChallenge(getChallengeById(id, answeredCount));
      soundFX.playDuelStart();
    },
    [answeredCount, selectedCategory, solvedSet]
  );

  const handleSelectCategory = useCallback(
    (cat: ChallengeCategory | 'all') => {
      setSelectedCategory(cat);
      const id = pickRandomChallengeId(cat, solvedSet, answeredCount);
      challengeSubmittedRef.current = false;
      setSharedChallengeContext(null);
      clearShareUrlParams();
      setLastServerDelta(null);
      setActiveChallenge(getChallengeById(id, answeredCount));
    },
    [answeredCount, solvedSet]
  );

  const applyLocalStandaloneOutcome = useCallback(
    (params: {
      challengeId: number;
      title: string;
      category: ChallengeCategory;
      difficulty: Difficulty;
      won: boolean;
      timeLeftRatio: number;
      mode: 'solo' | 'duel' | 'shared';
      overrideCountryDelta?: number;
      overrideRivalDelta?: number;
      overrideRivalCode?: string | null;
      nextStreakValue?: number;
    }) => {
      const now = Date.now();
      const targetRivalCode =
        params.overrideRivalCode !== undefined ? params.overrideRivalCode : effectiveRivalCode;
      const clampedRatio = Math.max(0, Math.min(1, Number(params.timeLeftRatio) || 0));
      const speedBonus = Math.round(clampedRatio * 12);
      const streakBonus = Math.min(Math.max(0, Math.floor(playerStreak)), 6) * 3;
      const computedCountryDelta =
        params.overrideCountryDelta !== undefined
          ? params.overrideCountryDelta
          : params.won
          ? 15 + speedBonus + streakBonus
          : -15;
      const computedRivalDelta =
        params.overrideRivalDelta !== undefined
          ? params.overrideRivalDelta
          : targetRivalCode
          ? params.won
            ? -8
            : 10
          : 0;

      let actualCountryDelta = computedCountryDelta;
      let actualRivalDelta = 0;

      setStandings((prev) => {
        const next = prev.map((s) => {
          if (s.code === myCountryCode) {
            const newPoints = Math.max(0, s.points + computedCountryDelta);
            actualCountryDelta = newPoints - s.points;
            const nextCountryStreak = params.won ? s.streak + 1 : 0;
            return {
              ...s,
              points: newPoints,
              wins: s.wins + (params.won ? 1 : 0),
              losses: s.losses + (params.won ? 0 : 1),
              streak: nextCountryStreak,
              bestStreak: Math.max(s.bestStreak, nextCountryStreak),
              lastDelta: computedCountryDelta < 0 && actualCountryDelta === 0 ? -15 : actualCountryDelta,
              updatedAt: now,
            };
          }
          if (targetRivalCode && s.code === targetRivalCode) {
            const newPoints = Math.max(0, s.points + computedRivalDelta);
            actualRivalDelta = newPoints - s.points;
            return {
              ...s,
              points: newPoints,
              lastDelta: actualRivalDelta,
              updatedAt: now,
            };
          }
          return s;
        });
        safeStorageSet(STORAGE_KEYS.standings, JSON.stringify(next));
        return next;
      });

      const evt: ScoreEvent = {
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        playerName,
        countryCode: myCountryCode,
        rivalCode: targetRivalCode,
        challengeId: params.challengeId,
        category: params.category,
        won: params.won,
        countryDelta: computedCountryDelta,
        rivalDelta: computedRivalDelta,
        timestamp: now,
      };
      setRecentEvents((prev) => {
        const next = [evt, ...prev].slice(0, 40);
        safeStorageSet(STORAGE_KEYS.events, JSON.stringify(next));
        return next;
      });

      if (params.mode !== 'duel') {
        setLastServerDelta({
          countryDelta: computedCountryDelta,
          rivalDelta: targetRivalCode ? computedRivalDelta : 0,
        });
      }

      const historyEntry: UserHistoryEntry = {
        id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
        challengeId: params.challengeId,
        title: params.title,
        category: params.category,
        difficulty: params.difficulty,
        won: params.won,
        userPointsDelta: computedCountryDelta,
        countryDelta: computedCountryDelta,
        countryCode: myCountryCode,
        rivalCode: targetRivalCode,
        mode: params.mode,
        timestamp: now,
      };

      const prev = userProfileRef.current;
      const nextStreak =
        params.nextStreakValue !== undefined
          ? params.nextStreakValue
          : params.won
          ? prev.currentStreak + 1
          : 0;
      const nextPts = Math.max(0, prev.userPoints + computedCountryDelta);
      const prevCatStat = prev.categoryStats?.[params.category] ?? {
        played: 0,
        won: 0,
        points: 0,
      };
      const updated: UserProfile = {
        ...prev,
        playerName,
        countryCode: myCountryCode,
        rivalCode: rivalCountryCode,
        userPoints: nextPts,
        wins: prev.wins + (params.won ? 1 : 0),
        losses: prev.losses + (params.won ? 0 : 1),
        currentStreak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
        answeredCount: prev.answeredCount + 1,
        solvedIds:
          params.won && !prev.solvedIds.includes(params.challengeId)
            ? [...prev.solvedIds, params.challengeId]
            : prev.solvedIds,
        categoryStats: {
          ...prev.categoryStats,
          [params.category]: {
            played: prevCatStat.played + 1,
            won: prevCatStat.won + (params.won ? 1 : 0),
            points: prevCatStat.points + computedCountryDelta,
          },
        },
        history: [historyEntry, ...(prev.history || [])].slice(0, 80),
        updatedAt: now,
      };
      setUserProfile(updated);
      safeStorageSet(STORAGE_KEYS.profile, JSON.stringify(updated));

      if (authUserRef.current && firebaseSyncedUidRef.current === authUserRef.current.uid) {
        lastRecordedHistoryIdRef.current = historyEntry.id;
        void recordOutcomeToFirestore(authUserRef.current.uid, updated, historyEntry).catch(
          (err) => {
            if (err instanceof Error && err.message.includes('operationType')) {
              setFirestoreError(err);
            }
          }
        );
      }
    },
    [effectiveRivalCode, myCountryCode, playerName, playerStreak, rivalCountryCode]
  );

  const handleCompleteChallenge = useCallback(
    async (outcome: ChallengeOutcome) => {
      if (submittingLockRef.current || challengeSubmittedRef.current) return;
      submittingLockRef.current = true;
      challengeSubmittedRef.current = true;
      setIsSubmitting(true);

      const nextStreak = outcome.won ? playerStreak + 1 : 0;
      setPlayerStreak(nextStreak);
      setAnsweredCount((prev) => prev + 1);

      if (outcome.won) {
        setSolvedIds((prev) =>
          prev.includes(outcome.challengeId) ? prev : [...prev, outcome.challengeId]
        );
      }

      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 5000);

      try {
        let serverApplied = false;
        if (backendAvailable !== false) {
          const data = await fetchJsonSafe<{
            standings?: CountryStanding[];
            event?: ScoreEvent;
            profile?: UserProfile;
            sharedChallenge?: SharedChallengeInfo;
          }>('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              userId: userProfile.userId || undefined,
              countryCode: myCountryCode,
              rivalCode: effectiveRivalCode,
              challengeId: outcome.challengeId,
              challengeTitle: activeChallenge?.title,
              category: activeChallenge?.category ?? 'enigma',
              difficulty: activeChallenge?.difficulty ?? 'facile',
              won: outcome.won,
              timeLeftRatio: outcome.timeLeftRatio,
              playerStreak: playerStreak,
              playerName,
              mode: sharedChallengeContext ? 'shared' : 'solo',
              shareId: sharedChallengeContext?.shareId ?? null,
            }),
          });

          if (data) {
            serverApplied = true;
            if (data.standings) {
              setStandings(data.standings);
              safeStorageSet(STORAGE_KEYS.standings, JSON.stringify(data.standings));
            }
            if (data.event) {
              setLastServerDelta({
                countryDelta: data.event.countryDelta,
                rivalDelta: data.event.rivalDelta,
              });
            }
            if (data.profile) {
              applyServerProfile(data.profile, false);
              const newestEntry = data.profile.history?.[0] as UserHistoryEntry | undefined;
              if (
                authUser &&
                firebaseSyncedUidRef.current === authUser.uid &&
                newestEntry &&
                newestEntry.id !== lastRecordedHistoryIdRef.current
              ) {
                lastRecordedHistoryIdRef.current = newestEntry.id;
                void recordOutcomeToFirestore(authUser.uid, data.profile, newestEntry).catch(
                  (err) => {
                    if (err instanceof Error && err.message.includes('operationType')) {
                      setFirestoreError(err);
                    }
                  }
                );
              }
            }
            if (data.sharedChallenge) {
              const scInfo = data.sharedChallenge;
              setSharedChallengeContext((prev) =>
                prev ? { ...prev, info: scInfo } : prev
              );
            }
          }
        }

        if (!serverApplied) {
          applyLocalStandaloneOutcome({
            challengeId: outcome.challengeId,
            title: activeChallenge?.title || `Défi #${outcome.challengeId}`,
            category: activeChallenge?.category ?? 'enigma',
            difficulty: activeChallenge?.difficulty ?? 'facile',
            won: outcome.won,
            timeLeftRatio: outcome.timeLeftRatio,
            mode: sharedChallengeContext ? 'shared' : 'solo',
            nextStreakValue: nextStreak,
          });
        }
      } finally {
        window.clearTimeout(timer);
        submittingLockRef.current = false;
        setIsSubmitting(false);
      }
    },
    [
      activeChallenge?.category,
      activeChallenge?.difficulty,
      activeChallenge?.title,
      applyLocalStandaloneOutcome,
      applyServerProfile,
      authUser,
      backendAvailable,
      effectiveRivalCode,
      myCountryCode,
      playerName,
      playerStreak,
      sharedChallengeContext,
      userProfile.userId,
    ]
  );

  const handleShareChallenge = useCallback(
    async (
      challengeId: number,
      outcome?: { won: boolean; pointsDelta: number }
    ): Promise<{ url: string; status: 'shared' | 'copied' | 'manual' } | null> => {
      let shareId: string | null = null;
      if (backendAvailable !== false) {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 4000);
        try {
          const data = await fetchJsonSafe<{ sharedChallenge?: { shareId?: string } }>(
            '/api/shared-challenges',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                challengeId,
                userId: userProfile.userId || undefined,
                playerName,
                countryCode: myCountryCode,
                won: outcome ? outcome.won : null,
                pointsDelta: outcome ? outcome.pointsDelta : 0,
              }),
            }
          );
          shareId = data?.sharedChallenge?.shareId ?? null;
        } finally {
          window.clearTimeout(timer);
        }
      }

      if (authUser && firebaseSyncedUidRef.current === authUser.uid) {
        const effectiveShareId =
          shareId || `fs_${challengeId}_${Date.now().toString(36)}`;
        void saveSharedChallengeToFirestore(authUser.uid, {
          shareId: effectiveShareId,
          challengeId,
          creatorName: playerName,
          creatorCountryCode: myCountryCode,
          won: outcome ? outcome.won : null,
          pointsDelta: outcome ? outcome.pointsDelta : 0,
        }).catch((err) => {
          if (err instanceof Error && err.message.includes('operationType')) {
            setFirestoreError(err);
          }
        });
      }

      const url = buildChallengeShareUrl({
        challengeId,
        shareId,
        playerName,
        countryCode: myCountryCode,
        won: outcome ? outcome.won : null,
        pointsDelta: outcome ? outcome.pointsDelta : 0,
      });

      const status = await shareOrCopyLink({
        title: `Quiz — Défi #${String(challengeId).padStart(5, '0')}`,
        text: `${playerName} (${myCountry.flag} ${myCountry.name}) vous met au défi sur Quiz ! Résolvez le Défi #${String(challengeId).padStart(5, '0')} :`,
        url,
      });
      return { url, status };
    },
    [
      authUser,
      backendAvailable,
      myCountry.flag,
      myCountry.name,
      myCountryCode,
      playerName,
      userProfile.userId,
    ]
  );

  const handleShareAndToast = useCallback(
    async (challengeId: number) => {
      const res = await handleShareChallenge(challengeId);
      if (res) {
        setShareToastUrl(res.url);
      }
    },
    [handleShareChallenge]
  );

  const handleRestoreSyncCode = useCallback(
    async (syncCode: string): Promise<{ ok: boolean; error?: string }> => {
      if (backendAvailable === false) {
        return {
          ok: false,
          error:
            'Sur cet hébergement statique, utilisez la connexion Google ci-dessus pour synchroniser vos appareils.',
        };
      }
      try {
        const res = await fetch(apiUrl('/api/profile/restore'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ syncCode }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          return {
            ok: false,
            error:
              'Serveur de codes indisponible ici. Utilisez la connexion Google pour sauvegarder votre parcours.',
          };
        }
        const data = await res.json();
        if (!res.ok || !data?.profile) {
          return { ok: false, error: data?.error || 'Code introuvable.' };
        }
        applyServerProfile(data.profile, true);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Impossible de contacter le serveur.' };
      }
    },
    [applyServerProfile, backendAvailable]
  );

  const cleanupFallbackDuels = useCallback(() => {
    if (firestoreDuelUnsubRef.current) {
      firestoreDuelUnsubRef.current();
      firestoreDuelUnsubRef.current = null;
    }
    if (localDuelBotTimerRef.current !== null) {
      window.clearTimeout(localDuelBotTimerRef.current);
      localDuelBotTimerRef.current = null;
    }
  }, []);

  // Auto-join ?room=XXXX via Firestore when running without WebSocket backend
  useEffect(() => {
    if (backendAvailable !== false || !pendingRoomJoinRef.current) return;
    const roomId = pendingRoomJoinRef.current;
    if (!authReady) return;
    if (!authUser) {
      setDuelError(
        `Connectez-vous avec Google pour rejoindre le salon ${roomId} en direct.`
      );
      return;
    }
    pendingRoomJoinRef.current = null;
    setClientId(authUser.uid);
    setDuelTransport('firestore');
    void joinFirestoreDuelRoom({
      uid: authUser.uid,
      roomId,
      playerName,
      countryCode: myCountryCode,
    })
      .then((res) => {
        if (!res.ok) {
          setDuelError(res.error || 'Salon introuvable.');
          return;
        }
        cleanupFallbackDuels();
        firestoreDuelUnsubRef.current = subscribeFirestoreDuelRoom(
          roomId,
          (room) => {
            setDuelError(null);
            setDuelRoom(room);
          },
          () => setDuelError(`Salon ${roomId} introuvable ou expiré.`),
          (err) => setFirestoreError(err)
        );
      })
      .catch((err) => {
        if (err instanceof Error && err.message.includes('operationType')) {
          setFirestoreError(err);
        } else {
          setDuelError('Impossible de rejoindre le salon.');
        }
      });
  }, [authReady, authUser, backendAvailable, cleanupFallbackDuels, myCountryCode, playerName]);

  // Award country & profile points when a Firestore or Local AI duel finishes
  useEffect(() => {
    if (!duelRoom || duelRoom.status !== 'finished') return;
    if (duelTransport !== 'firestore' && duelTransport !== 'local') return;
    const finishKey = `${duelRoom.roomId}:${duelRoom.currentRound}`;
    if (finalizedDuelRoomRef.current === finishKey) return;
    finalizedDuelRoomRef.current = finishKey;

    if (!duelRoom.winnerClientId) return;
    const activeMyId = duelTransport === 'firestore' ? authUser?.uid : clientId;
    if (!activeMyId) return;
    const won = duelRoom.winnerClientId === activeMyId;
    const opp = duelRoom.players.find((p) => p.clientId !== activeMyId);
    const oppCode =
      opp && opp.countryCode !== myCountryCode ? opp.countryCode : effectiveRivalCode;

    applyLocalStandaloneOutcome({
      challengeId: duelRoom.challengeIds[0] || 1,
      title: `Duel Live ${duelRoom.roomId} (5 manches)`,
      category: 'speed',
      difficulty: 'moyen',
      won,
      timeLeftRatio: 0.5,
      mode: 'duel',
      overrideCountryDelta: won ? 60 : -35,
      overrideRivalDelta: oppCode ? (won ? -35 : 60) : 0,
      overrideRivalCode: oppCode ?? null,
    });
  }, [
    applyLocalStandaloneOutcome,
    authUser?.uid,
    clientId,
    duelRoom,
    duelTransport,
    effectiveRivalCode,
    myCountryCode,
  ]);

  useEffect(() => {
    return () => cleanupFallbackDuels();
  }, [cleanupFallbackDuels]);

  const startLocalAiDuel = useCallback(() => {
    cleanupFallbackDuels();
    finalizedDuelRoomRef.current = null;
    const myLocalId = userProfile.userId || `local-${Date.now()}`;
    setClientId(myLocalId);
    setDuelTransport('local');
    setDuelError(null);
    setIsQueued(true);

    localDuelBotTimerRef.current = window.setTimeout(() => {
      setIsQueued(false);
      const picked = new Set<number>();
      const challengeIds: number[] = [];
      for (const cat of ['enigma', 'logic', 'focus', 'speed', 'riddle'] as const) {
        const id = pickRandomChallengeId(cat, picked, answeredCount);
        picked.add(id);
        challengeIds.push(id);
      }
      const oppPool = COUNTRIES.filter((c) => c.code !== myCountryCode);
      const oppCountry =
        rivalCountry && rivalCountry.code !== myCountryCode
          ? rivalCountry
          : oppPool[Math.floor(Math.random() * oppPool.length)];
      const botNames = ['Alex', 'Nadia', 'Kenji', 'Sofia', 'Lukas', 'Maya', 'Tariq'];
      const botName = botNames[Math.floor(Math.random() * botNames.length)];

      setDuelRoom({
        roomId: 'DUEL',
        status: 'playing',
        challengeIds,
        currentRound: 0,
        players: [
          {
            clientId: myLocalId,
            playerName,
            countryCode: myCountryCode,
            roundScores: [],
            totalScore: 0,
            currentRoundDone: false,
            lastRoundCorrect: null,
          },
          {
            clientId: 'bot-rival',
            playerName: `${botName} (${oppCountry.code})`,
            countryCode: oppCountry.code,
            roundScores: [],
            totalScore: 0,
            currentRoundDone: false,
            lastRoundCorrect: null,
          },
        ],
        winnerClientId: null,
        countryPointsAwarded: 60,
        countryPointsLost: 35,
      });
    }, 800);
  }, [
    answeredCount,
    cleanupFallbackDuels,
    myCountryCode,
    playerName,
    rivalCountry,
    userProfile.userId,
  ]);

  const handleDuelJoinQueue = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      setDuelTransport('ws');
      ws.send(
        JSON.stringify({
          type: 'duel:queue',
          userId: userProfile.userId || undefined,
          playerName,
          countryCode: myCountryCode,
        })
      );
      return;
    }
    startLocalAiDuel();
  }, [myCountryCode, playerName, startLocalAiDuel, userProfile.userId]);

  const handleDuelCancelQueue = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'duel:cancel_queue' }));
    } else {
      cleanupFallbackDuels();
      setIsQueued(false);
    }
  }, [cleanupFallbackDuels]);

  const handleDuelCreateRoom = useCallback(async () => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      setDuelTransport('ws');
      ws.send(
        JSON.stringify({
          type: 'duel:create',
          userId: userProfile.userId || undefined,
          playerName,
          countryCode: myCountryCode,
        })
      );
      return;
    }

    let activeUser = authUser;
    if (!activeUser) {
      activeUser = await signInWithGoogle();
      if (!activeUser) {
        setDuelError(
          'Connectez-vous avec Google pour créer un salon multijoueur privé en ligne, ou utilisez Matchmaking Mondial.'
        );
        return;
      }
    }

    try {
      cleanupFallbackDuels();
      finalizedDuelRoomRef.current = null;
      setDuelError(null);
      setClientId(activeUser.uid);
      setDuelTransport('firestore');
      const roomId = await createFirestoreDuelRoom({
        uid: activeUser.uid,
        playerName,
        countryCode: myCountryCode,
      });
      firestoreDuelUnsubRef.current = subscribeFirestoreDuelRoom(
        roomId,
        (room) => setDuelRoom(room),
        () => setDuelError('Le salon a été fermé.'),
        (err) => setFirestoreError(err)
      );
    } catch (err) {
      if (err instanceof Error && err.message.includes('operationType')) {
        setFirestoreError(err);
      } else {
        setDuelError('Impossible de créer le salon pour le moment.');
      }
    }
  }, [
    authUser,
    cleanupFallbackDuels,
    myCountryCode,
    playerName,
    signInWithGoogle,
    userProfile.userId,
  ]);

  const handleDuelJoinRoom = useCallback(
    async (roomId: string) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        setDuelTransport('ws');
        ws.send(
          JSON.stringify({
            type: 'duel:join',
            roomId,
            userId: userProfile.userId || undefined,
            playerName,
            countryCode: myCountryCode,
          })
        );
        return;
      }

      let activeUser = authUser;
      if (!activeUser) {
        activeUser = await signInWithGoogle();
        if (!activeUser) {
          setDuelError('Connectez-vous avec Google pour rejoindre un salon privé.');
          return;
        }
      }

      try {
        cleanupFallbackDuels();
        finalizedDuelRoomRef.current = null;
        setDuelError(null);
        setClientId(activeUser.uid);
        setDuelTransport('firestore');
        const res = await joinFirestoreDuelRoom({
          uid: activeUser.uid,
          roomId,
          playerName,
          countryCode: myCountryCode,
        });
        if (!res.ok) {
          setDuelError(res.error || 'Salon introuvable.');
          return;
        }
        firestoreDuelUnsubRef.current = subscribeFirestoreDuelRoom(
          roomId,
          (room) => setDuelRoom(room),
          () => setDuelError(`Salon ${roomId} introuvable.`),
          (err) => setFirestoreError(err)
        );
      } catch (err) {
        if (err instanceof Error && err.message.includes('operationType')) {
          setFirestoreError(err);
        } else {
          setDuelError('Impossible de rejoindre ce salon.');
        }
      }
    },
    [
      authUser,
      cleanupFallbackDuels,
      myCountryCode,
      playerName,
      signInWithGoogle,
      userProfile.userId,
    ]
  );

  const handleDuelSubmitRound = useCallback(
    (roomId: string, roundIndex: number, won: boolean, timeLeftRatio: number) => {
      const ws = wsRef.current;
      if (duelTransport === 'ws' && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'duel:round_submit',
            roomId,
            roundIndex,
            won,
            timeLeftRatio,
          })
        );
        return;
      }

      if (duelTransport === 'firestore' && authUser) {
        void submitFirestoreDuelRound({
          roomId,
          uid: authUser.uid,
          roundIndex,
          won,
          timeLeftRatio,
        }).catch((err) => {
          if (err instanceof Error && err.message.includes('operationType')) {
            setFirestoreError(err);
          }
        });
        return;
      }

      // Local AI duel round progression
      setDuelRoom((prev) => {
        if (!prev || prev.status !== 'playing' || prev.currentRound !== roundIndex) return prev;
        const clampedRatio = Math.max(0, Math.min(1, Number(timeLeftRatio) || 0));
        const myRoundPts = won ? 100 + Math.round(clampedRatio * 50) : 0;
        const botWon = Math.random() < 0.68;
        const botRoundPts = botWon ? 90 + Math.round(Math.random() * 45) : 0;

        const nextPlayers = prev.players.map((p) => {
          if (p.clientId === 'bot-rival') {
            return {
              ...p,
              roundScores: [...p.roundScores, botRoundPts],
              totalScore: p.totalScore + botRoundPts,
              currentRoundDone: false,
              lastRoundCorrect: botWon,
            };
          }
          return {
            ...p,
            roundScores: [...p.roundScores, myRoundPts],
            totalScore: p.totalScore + myRoundPts,
            currentRoundDone: false,
            lastRoundCorrect: won,
          };
        });

        const meAfter = nextPlayers.find((p) => p.clientId !== 'bot-rival')!;
        const botAfter = nextPlayers.find((p) => p.clientId === 'bot-rival')!;
        const isLast = roundIndex >= prev.challengeIds.length - 1;
        return {
          ...prev,
          status: isLast ? 'finished' : 'playing',
          currentRound: isLast ? roundIndex : roundIndex + 1,
          players: nextPlayers,
          winnerClientId: isLast
            ? meAfter.totalScore > botAfter.totalScore
              ? meAfter.clientId
              : botAfter.totalScore > meAfter.totalScore
              ? botAfter.clientId
              : null
            : null,
        };
      });
    },
    [authUser, duelTransport]
  );

  const handleDuelLeaveRoom = useCallback(() => {
    const ws = wsRef.current;
    if (duelTransport === 'ws' && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'duel:leave' }));
    }
    cleanupFallbackDuels();
    setDuelRoom(null);
    setDuelTransport(null);
    setDuelError(null);
    clearShareUrlParams();
  }, [cleanupFallbackDuels, duelTransport]);

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        myCountry={myCountry}
        myStanding={myStanding}
        onOpenCountryPicker={() => setPickerMode('player')}
        isAuthenticated={Boolean(authUser)}
        authUserLabel={authUser?.displayName || playerName}
        isSigningIn={isSigningIn}
        onSignInGoogle={() => {
          void signInWithGoogle();
        }}
        onOpenParcours={() => setActiveTab('parcours')}
      />

      <main>
        {authError && (
          <div className="mx-auto mt-4 max-w-[1440px] px-4 sm:px-6">
            <div className="flex flex-col gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-medium text-rose-200">{authError}</span>
              <button
                type="button"
                onClick={clearAuthError}
                className="shrink-0 self-start rounded-lg border border-rose-400/30 px-2.5 py-1 text-xs font-semibold text-rose-100 hover:bg-rose-500/20 sm:self-center"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {shareToastUrl && (
          <div className="mx-auto mt-4 max-w-[1440px] px-4 sm:px-6">
            <div className="flex flex-col gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-semibold text-amber-100">
                Lien du défi prêt à partager avec un ami :
              </span>
              <div className="flex items-center gap-2 w-full sm:max-w-md">
                <input
                  type="text"
                  readOnly
                  value={shareToastUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full rounded border border-white/15 bg-[#0B1120] px-2.5 py-1.5 font-mono-num text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShareToastUrl(null)}
                  className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'arena' && (
          <ArenaView
            myCountry={myCountry}
            myStanding={myStanding}
            myRank={myRank}
            rivalCountry={rivalCountry}
            rivalStanding={rivalStanding}
            rivalRank={rivalRank}
            selectedCategory={selectedCategory}
            activeChallenge={activeChallenge}
            playerStreak={playerStreak}
            userPoints={userProfile.userPoints}
            answeredCount={answeredCount}
            currentTimeLimitSec={getTimeLimitForProgress(answeredCount)}
            currentDifficulty={getDifficultyTierForProgress(answeredCount)}
            lastServerDelta={lastServerDelta}
            isSubmitting={isSubmitting}
            topStandings={sortedStandings}
            recentEvents={recentEvents}
            sharedChallengeContext={sharedChallengeContext}
            onDismissSharedContext={() => {
              setSharedChallengeContext(null);
              clearShareUrlParams();
            }}
            onShareChallenge={handleShareChallenge}
            onSelectCategory={handleSelectCategory}
            onStartChallenge={startNewChallenge}
            onCompleteChallenge={handleCompleteChallenge}
            onOpenMyCountryPicker={() => setPickerMode('player')}
            onOpenRivalPicker={() => setPickerMode('rival')}
            onClearRival={() => setRivalCountryCode(null)}
            onOpenLeaderboard={() => setActiveTab('leaderboard')}
            onOpenLiveDuel={() => setActiveTab('duel')}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            standings={standings}
            myCountry={myCountry}
            rivalCountry={rivalCountry}
            onDefyCountry={(code) => {
              setRivalCountryCode(code);
              setActiveTab('arena');
              startNewChallenge();
            }}
          />
        )}

        {activeTab === 'duel' && (
          <LiveDuelView
            myCountry={myCountry}
            playerName={playerName}
            clientId={clientId}
            onlineCount={onlineCount}
            isQueued={isQueued}
            duelRoom={duelRoom}
            duelError={duelError}
            onJoinQueue={handleDuelJoinQueue}
            onCancelQueue={handleDuelCancelQueue}
            onCreateRoom={() => {
              void handleDuelCreateRoom();
            }}
            onJoinRoom={(roomId) => {
              void handleDuelJoinRoom(roomId);
            }}
            onSubmitRound={handleDuelSubmitRound}
            onLeaveRoom={handleDuelLeaveRoom}
          />
        )}

        {activeTab === 'catalog' && (
          <CatalogView
            solvedIds={solvedIds}
            onPlaySpecificChallenge={(id) => {
              const ch = getChallengeById(id, answeredCount);
              challengeSubmittedRef.current = false;
              setSharedChallengeContext(null);
              clearShareUrlParams();
              setSelectedCategory(ch.category);
              setLastServerDelta(null);
              setActiveChallenge(ch);
              setActiveTab('arena');
              soundFX.playDuelStart();
            }}
            onPlayCategory={(cat) => {
              setSelectedCategory(cat);
              const id = pickRandomChallengeId(cat, solvedSet, answeredCount);
              challengeSubmittedRef.current = false;
              setSharedChallengeContext(null);
              clearShareUrlParams();
              setLastServerDelta(null);
              setActiveChallenge(getChallengeById(id, answeredCount));
              setActiveTab('arena');
              soundFX.playDuelStart();
            }}
            onShareChallengeId={handleShareAndToast}
          />
        )}

        {activeTab === 'parcours' && (
          <ParcoursView
            profile={userProfile}
            myCountry={myCountry}
            authUser={
              authUser
                ? {
                    uid: authUser.uid,
                    displayName: authUser.displayName,
                    email: authUser.email,
                  }
                : null
            }
            isSigningIn={isSigningIn}
            authError={authError}
            onSignInGoogle={() => {
              void signInWithGoogle();
            }}
            onSignOutGoogle={() => {
              void signOutGoogle();
            }}
            onPlaySpecificChallenge={(id) => {
              const ch = getChallengeById(id, answeredCount);
              challengeSubmittedRef.current = false;
              setSharedChallengeContext(null);
              clearShareUrlParams();
              setSelectedCategory(ch.category);
              setLastServerDelta(null);
              setActiveChallenge(ch);
              setActiveTab('arena');
              soundFX.playDuelStart();
            }}
            onShareChallengeId={handleShareAndToast}
            onRestoreSyncCode={handleRestoreSyncCode}
            onOpenCountryPicker={() => setPickerMode('player')}
          />
        )}
      </main>

      <CountryPickerModal
        isOpen={pickerMode !== null}
        mode={pickerMode === 'rival' ? 'rival' : 'player'}
        selectedCode={pickerMode === 'rival' ? effectiveRivalCode ?? '' : myCountryCode}
        playerName={playerName}
        standingsMap={standingsMap}
        rankMap={rankMap}
        onSelectCountry={(code) => {
          if (pickerMode === 'rival') {
            if (code !== myCountryCode) setRivalCountryCode(code);
          } else {
            setMyCountryCode(code);
            if (rivalCountryCode === code) setRivalCountryCode(null);
          }
        }}
        onChangePlayerName={setPlayerName}
        onClose={() => setPickerMode(null)}
      />
    </div>
  );
}

import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  ChallengeCategory,
  Difficulty,
  UserCategoryStats,
  UserHistoryEntry,
  UserProfile,
} from '../types/game';
import { OperationType, db, handleFirestoreError } from '../firebase';

const CATEGORIES: ChallengeCategory[] = [
  'enigma',
  'logic',
  'focus',
  'speed',
  'creation',
  'riddle',
];

const DIFFICULTIES: Difficulty[] = ['facile', 'moyen', 'difficile', 'maitre'];

function sanitizeId(raw: string, fallbackPrefix = 'id'): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 128);
  return cleaned.length >= 1 ? cleaned : `${fallbackPrefix}_${Date.now()}`;
}

export function makeSafeHistoryEntryId(timestamp: number, rawId?: string): string {
  const safeTs = Math.max(1, Math.floor(timestamp));
  const revTs = Math.max(0, 9999999999999 - safeTs);
  const suffix = rawId
    ? rawId.replace(/[^a-zA-Z0-9_\-]/g, '').slice(-16)
    : Math.random().toString(36).slice(2, 10);
  return sanitizeId(`h_${revTs}_${suffix || 'item'}`, 'h');
}

function sanitizePlayerName(name: string): string {
  const trimmed = (name || '').trim().slice(0, 24);
  return trimmed.length >= 1 ? trimmed : 'Champion';
}

function sanitizeCountryCode(code: string): string {
  const upper = (code || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(upper) ? upper : 'FR';
}

function sanitizeRivalCode(code: string | null | undefined): string {
  const upper = (code || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(upper) ? upper : '';
}

function sanitizeSyncCode(code: string | undefined): string {
  const cleaned = (code || 'LOCAL').trim().slice(0, 24);
  return cleaned.length >= 2 ? cleaned : 'LOCAL';
}

function clampInt(val: unknown, min: number, max: number): number {
  const n = typeof val === 'number' && Number.isFinite(val) ? Math.floor(val) : min;
  return Math.max(min, Math.min(max, n));
}

function sanitizeSolvedIds(ids: unknown): number[] {
  if (!Array.isArray(ids)) return [];
  const unique = new Set<number>();
  for (const item of ids) {
    const num = typeof item === 'number' ? Math.floor(item) : NaN;
    if (Number.isInteger(num) && num >= 1 && num <= 12500) {
      unique.add(num);
    }
  }
  return Array.from(unique).slice(-2000);
}

function sanitizeCategoryStats(
  raw: Partial<Record<ChallengeCategory, Partial<UserCategoryStats>>> | undefined
): Record<ChallengeCategory, UserCategoryStats> {
  const result = {} as Record<ChallengeCategory, UserCategoryStats>;
  for (const cat of CATEGORIES) {
    const entry = raw?.[cat];
    result[cat] = {
      played: clampInt(entry?.played, 0, 1000000),
      won: clampInt(entry?.won, 0, 1000000),
      points: clampInt(entry?.points, -10000000, 10000000),
    };
  }
  return result;
}

function mergeCategoryStats(
  a: Record<ChallengeCategory, UserCategoryStats>,
  b: Record<ChallengeCategory, UserCategoryStats>
): Record<ChallengeCategory, UserCategoryStats> {
  const merged = {} as Record<ChallengeCategory, UserCategoryStats>;
  for (const cat of CATEGORIES) {
    const sa = a[cat];
    const sb = b[cat];
    merged[cat] = {
      played: clampInt(Math.max(sa.played, sb.played), 0, 1000000),
      won: clampInt(Math.max(sa.won, sb.won), 0, 1000000),
      points: clampInt(Math.max(sa.points, sb.points), -10000000, 10000000),
    };
  }
  return merged;
}

function buildFirestoreHistoryPayload(uid: string, entry: UserHistoryEntry, safeId: string) {
  const safeCat: ChallengeCategory = CATEGORIES.includes(entry.category)
    ? entry.category
    : 'enigma';
  const safeDiff: Difficulty = DIFFICULTIES.includes(entry.difficulty)
    ? entry.difficulty
    : 'facile';
  const safeMode: 'solo' | 'duel' | 'shared' =
    entry.mode === 'duel' || entry.mode === 'shared' ? entry.mode : 'solo';

  return {
    id: safeId,
    userId: uid,
    challengeId: clampInt(entry.challengeId, 1, 12500),
    title: (entry.title || `Défi #${entry.challengeId}`).trim().slice(0, 120) || 'Défi',
    category: safeCat,
    difficulty: safeDiff,
    won: Boolean(entry.won),
    userPointsDelta: clampInt(entry.userPointsDelta, -500, 500),
    countryDelta: clampInt(entry.countryDelta, -500, 500),
    countryCode: sanitizeCountryCode(entry.countryCode),
    rivalCode: sanitizeRivalCode(entry.rivalCode),
    mode: safeMode,
    timestamp: Math.max(1, Math.floor(entry.timestamp || Date.now())),
    createdAt: serverTimestamp(),
  };
}

export async function ensureOrMergeFirestoreProfile(
  uid: string,
  localProfile: UserProfile
): Promise<UserProfile> {
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  let snap;
  try {
    snap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  if (!snap.exists()) {
    const cleanSolved = sanitizeSolvedIds(localProfile.solvedIds);
    const cleanStats = sanitizeCategoryStats(localProfile.categoryStats);
    const cleanMeta = {
      userId: uid,
      syncCode: sanitizeSyncCode(localProfile.syncCode),
      playerName: sanitizePlayerName(localProfile.playerName),
      countryCode: sanitizeCountryCode(localProfile.countryCode),
      rivalCode: sanitizeRivalCode(localProfile.rivalCode),
      userPoints: clampInt(localProfile.userPoints, 0, 100000000),
      wins: clampInt(localProfile.wins, 0, 1000000),
      losses: clampInt(localProfile.losses, 0, 1000000),
      currentStreak: clampInt(localProfile.currentStreak, 0, 1000000),
      bestStreak: clampInt(localProfile.bestStreak, 0, 1000000),
      answeredCount: clampInt(localProfile.answeredCount, 0, 1000000),
      solvedIds: cleanSolved,
      categoryStats: cleanStats,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(userRef, cleanMeta);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userPath);
    }

    // Backfill up to 25 recent local history records into subcollection
    const initialHistory = (localProfile.history || []).slice(0, 25);
    if (initialHistory.length > 0) {
      const batch = writeBatch(db);
      for (const item of initialHistory) {
        const safeId = makeSafeHistoryEntryId(item.timestamp, item.id);
        const hRef = doc(db, 'users', uid, 'history', safeId);
        batch.set(hRef, buildFirestoreHistoryPayload(uid, item, safeId));
      }
      try {
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${userPath}/history`);
      }
    }

    return {
      ...localProfile,
      syncCode: cleanMeta.syncCode,
      playerName: cleanMeta.playerName,
      countryCode: cleanMeta.countryCode,
      rivalCode: cleanMeta.rivalCode || null,
      userPoints: cleanMeta.userPoints,
      wins: cleanMeta.wins,
      losses: cleanMeta.losses,
      currentStreak: cleanMeta.currentStreak,
      bestStreak: cleanMeta.bestStreak,
      answeredCount: cleanMeta.answeredCount,
      solvedIds: cleanSolved,
      categoryStats: cleanStats,
      updatedAt: Date.now(),
    };
  }

  const cloud = snap.data() as Record<string, unknown>;
  const cloudStats = sanitizeCategoryStats(
    cloud.categoryStats as Partial<Record<ChallengeCategory, Partial<UserCategoryStats>>>
  );
  const localStats = sanitizeCategoryStats(localProfile.categoryStats);

  const cloudSolved = sanitizeSolvedIds(cloud.solvedIds);
  const localSolved = sanitizeSolvedIds(localProfile.solvedIds);
  const mergedSolved = Array.from(new Set([...cloudSolved, ...localSolved])).slice(-2000);

  const cloudAnswered = clampInt(cloud.answeredCount, 0, 1000000);
  const localAnswered = clampInt(localProfile.answeredCount, 0, 1000000);
  const mergedAnswered = Math.max(cloudAnswered, localAnswered);

  const mergedPoints = Math.max(
    clampInt(cloud.userPoints, 0, 100000000),
    clampInt(localProfile.userPoints, 0, 100000000)
  );
  const mergedWins = Math.max(
    clampInt(cloud.wins, 0, 1000000),
    clampInt(localProfile.wins, 0, 1000000)
  );
  const mergedLosses = Math.max(
    clampInt(cloud.losses, 0, 1000000),
    clampInt(localProfile.losses, 0, 1000000)
  );
  const mergedStreak = Math.max(
    clampInt(cloud.currentStreak, 0, 1000000),
    clampInt(localProfile.currentStreak, 0, 1000000)
  );
  const mergedBestStreak = Math.max(
    clampInt(cloud.bestStreak, 0, 1000000),
    clampInt(localProfile.bestStreak, 0, 1000000)
  );
  const mergedStats = mergeCategoryStats(cloudStats, localStats);

  const cloudSyncCode = sanitizeSyncCode(cloud.syncCode as string | undefined);
  const localSyncCode = sanitizeSyncCode(localProfile.syncCode);
  const chosenSyncCode =
    cloudSyncCode !== 'LOCAL' ? cloudSyncCode : localSyncCode;

  const chosenName =
    cloudAnswered >= localAnswered
      ? sanitizePlayerName(String(cloud.playerName || localProfile.playerName))
      : sanitizePlayerName(localProfile.playerName);
  const chosenCountry =
    cloudAnswered >= localAnswered
      ? sanitizeCountryCode(String(cloud.countryCode || localProfile.countryCode))
      : sanitizeCountryCode(localProfile.countryCode);
  const chosenRival =
    cloudAnswered >= localAnswered
      ? sanitizeRivalCode((cloud.rivalCode as string) ?? '')
      : sanitizeRivalCode(localProfile.rivalCode);

  const needsCloudUpdate =
    mergedPoints > clampInt(cloud.userPoints, 0, 100000000) ||
    mergedWins > clampInt(cloud.wins, 0, 1000000) ||
    mergedAnswered > cloudAnswered ||
    mergedSolved.length > cloudSolved.length ||
    chosenSyncCode !== cloudSyncCode;

  if (needsCloudUpdate) {
    try {
      await updateDoc(userRef, {
        syncCode: chosenSyncCode,
        playerName: chosenName,
        countryCode: chosenCountry,
        rivalCode: chosenRival,
        userPoints: mergedPoints,
        wins: mergedWins,
        losses: mergedLosses,
        currentStreak: mergedStreak,
        bestStreak: mergedBestStreak,
        answeredCount: mergedAnswered,
        solvedIds: mergedSolved,
        categoryStats: mergedStats,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userPath);
    }
  }

  return {
    ...localProfile,
    syncCode: chosenSyncCode,
    playerName: chosenName,
    countryCode: chosenCountry,
    rivalCode: chosenRival || null,
    userPoints: mergedPoints,
    wins: mergedWins,
    losses: mergedLosses,
    currentStreak: mergedStreak,
    bestStreak: mergedBestStreak,
    answeredCount: mergedAnswered,
    solvedIds: mergedSolved,
    categoryStats: mergedStats,
    updatedAt: Date.now(),
  };
}

export function subscribeToFirestoreHistory(
  uid: string,
  onHistory: (entries: UserHistoryEntry[]) => void
): () => void {
  const historyPath = `users/${uid}/history`;
  const q = query(
    collection(db, 'users', uid, 'history'),
    where('userId', '==', uid),
    limit(60)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: UserHistoryEntry[] = snapshot.docs
        .map((docSnap) => {
          const d = docSnap.data();
          return {
            id: String(d.id || docSnap.id),
            challengeId: Number(d.challengeId || 1),
            title: String(d.title || `Défi #${d.challengeId || 1}`),
            category: (CATEGORIES.includes(d.category) ? d.category : 'enigma') as ChallengeCategory,
            difficulty: (DIFFICULTIES.includes(d.difficulty) ? d.difficulty : 'facile') as Difficulty,
            won: Boolean(d.won),
            userPointsDelta: Number(d.userPointsDelta || 0),
            countryDelta: Number(d.countryDelta || 0),
            countryCode: sanitizeCountryCode(String(d.countryCode || 'FR')),
            rivalCode: d.rivalCode ? String(d.rivalCode) : null,
            mode: (d.mode === 'duel' || d.mode === 'shared' ? d.mode : 'solo') as
              | 'solo'
              | 'duel'
              | 'shared',
            timestamp: Number(d.timestamp || Date.now()),
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);
      onHistory(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, historyPath);
    }
  );
}

export async function syncProfileMetaToFirestore(
  uid: string,
  meta: {
    syncCode: string;
    playerName: string;
    countryCode: string;
    rivalCode: string | null;
  }
): Promise<void> {
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    await updateDoc(userRef, {
      syncCode: sanitizeSyncCode(meta.syncCode),
      playerName: sanitizePlayerName(meta.playerName),
      countryCode: sanitizeCountryCode(meta.countryCode),
      rivalCode: sanitizeRivalCode(meta.rivalCode),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function recordOutcomeToFirestore(
  uid: string,
  updatedProfile: UserProfile,
  historyEntry: UserHistoryEntry
): Promise<void> {
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);
  const safeEntryId = makeSafeHistoryEntryId(historyEntry.timestamp, historyEntry.id);
  const historyRef = doc(db, 'users', uid, 'history', safeEntryId);

  const batch = writeBatch(db);
  batch.update(userRef, {
    syncCode: sanitizeSyncCode(updatedProfile.syncCode),
    playerName: sanitizePlayerName(updatedProfile.playerName),
    countryCode: sanitizeCountryCode(updatedProfile.countryCode),
    rivalCode: sanitizeRivalCode(updatedProfile.rivalCode),
    userPoints: clampInt(updatedProfile.userPoints, 0, 100000000),
    wins: clampInt(updatedProfile.wins, 0, 1000000),
    losses: clampInt(updatedProfile.losses, 0, 1000000),
    currentStreak: clampInt(updatedProfile.currentStreak, 0, 1000000),
    bestStreak: clampInt(updatedProfile.bestStreak, 0, 1000000),
    answeredCount: clampInt(updatedProfile.answeredCount, 0, 1000000),
    solvedIds: sanitizeSolvedIds(updatedProfile.solvedIds),
    categoryStats: sanitizeCategoryStats(updatedProfile.categoryStats),
    updatedAt: serverTimestamp(),
  });
  batch.set(historyRef, buildFirestoreHistoryPayload(uid, historyEntry, safeEntryId));

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function saveSharedChallengeToFirestore(
  uid: string,
  params: {
    shareId: string;
    challengeId: number;
    creatorName: string;
    creatorCountryCode: string;
    won: boolean | null;
    pointsDelta: number;
  }
): Promise<void> {
  const safeShareId = sanitizeId(params.shareId, 'sh').slice(0, 64);
  if (safeShareId.length < 4) return;
  const path = `sharedChallenges/${safeShareId}`;

  try {
    await setDoc(doc(db, 'sharedChallenges', safeShareId), {
      shareId: safeShareId,
      creatorUserId: uid,
      challengeId: clampInt(params.challengeId, 1, 12500),
      creatorName: sanitizePlayerName(params.creatorName),
      creatorCountryCode: sanitizeCountryCode(params.creatorCountryCode),
      creatorWon: Boolean(params.won),
      creatorFinished: params.won !== null,
      creatorPointsDelta: clampInt(params.pointsDelta, -500, 500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

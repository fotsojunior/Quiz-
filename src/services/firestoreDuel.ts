import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { pickRandomChallengeId } from '../data/challengesGenerator';
import { OperationType, db, handleFirestoreError } from '../firebase';
import { DuelPlayerState, LiveDuelRoom } from '../types/game';

function sanitizeName(name: string): string {
  const cleaned = (name || '').trim().slice(0, 24);
  return cleaned.length >= 1 ? cleaned : 'Champion';
}

function sanitizeCountry(code: string): string {
  const upper = (code || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(upper) ? upper : 'FR';
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function pickFiveDuelChallenges(): number[] {
  const picked = new Set<number>();
  const cats = ['enigma', 'logic', 'focus', 'speed', 'riddle'] as const;
  for (const cat of cats) {
    picked.add(pickRandomChallengeId(cat, picked, 10));
  }
  while (picked.size < 5) {
    picked.add(pickRandomChallengeId('all', picked, 10));
  }
  return Array.from(picked).slice(0, 5);
}

interface FirestoreDuelDoc {
  roomId: string;
  status: 'waiting' | 'playing' | 'finished';
  challengeIds: number[];
  currentRound: number;
  hostUserId: string;
  hostName: string;
  hostCountryCode: string;
  hostScore: number;
  hostRoundDone: boolean;
  hostLastCorrect: boolean;
  guestUserId: string;
  guestName: string;
  guestCountryCode: string;
  guestScore: number;
  guestRoundDone: boolean;
  guestLastCorrect: boolean;
  winnerUserId: string;
}

function toLiveDuelRoom(d: FirestoreDuelDoc): LiveDuelRoom {
  const players: DuelPlayerState[] = [
    {
      clientId: d.hostUserId,
      userId: d.hostUserId,
      playerName: d.hostName,
      countryCode: d.hostCountryCode,
      roundScores: [],
      totalScore: d.hostScore,
      currentRoundDone: d.hostRoundDone,
      lastRoundCorrect: d.hostRoundDone ? d.hostLastCorrect : null,
    },
  ];
  if (d.guestUserId) {
    players.push({
      clientId: d.guestUserId,
      userId: d.guestUserId,
      playerName: d.guestName || 'Adversaire',
      countryCode: d.guestCountryCode || 'FR',
      roundScores: [],
      totalScore: d.guestScore,
      currentRoundDone: d.guestRoundDone,
      lastRoundCorrect: d.guestRoundDone ? d.guestLastCorrect : null,
    });
  }

  return {
    roomId: d.roomId,
    status: d.status,
    challengeIds: d.challengeIds,
    currentRound: d.currentRound,
    players,
    winnerClientId: d.winnerUserId ? d.winnerUserId : null,
    countryPointsAwarded: 60,
    countryPointsLost: 35,
  };
}

export async function createFirestoreDuelRoom(params: {
  uid: string;
  playerName: string;
  countryCode: string;
}): Promise<string> {
  const roomId = generateRoomCode();
  const path = `duelRooms/${roomId}`;
  const ref = doc(db, 'duelRooms', roomId);

  try {
    const existing = await getDoc(ref);
    const finalRoomId = existing.exists()
      ? `${roomId}${Math.floor(Math.random() * 90 + 10)}`
      : roomId;
    const finalRef = doc(db, 'duelRooms', finalRoomId);

    await setDoc(finalRef, {
      roomId: finalRoomId,
      status: 'waiting',
      challengeIds: pickFiveDuelChallenges(),
      currentRound: 0,
      hostUserId: params.uid,
      hostName: sanitizeName(params.playerName),
      hostCountryCode: sanitizeCountry(params.countryCode),
      hostScore: 0,
      hostRoundDone: false,
      hostLastCorrect: false,
      guestUserId: '',
      guestName: '',
      guestCountryCode: '',
      guestScore: 0,
      guestRoundDone: false,
      guestLastCorrect: false,
      winnerUserId: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return finalRoomId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function joinFirestoreDuelRoom(params: {
  uid: string;
  roomId: string;
  playerName: string;
  countryCode: string;
}): Promise<{ ok: boolean; error?: string }> {
  const cleanRoomId = params.roomId.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,16}$/.test(cleanRoomId)) {
    return { ok: false, error: 'Code de salon invalide.' };
  }
  const path = `duelRooms/${cleanRoomId}`;
  const ref = doc(db, 'duelRooms', cleanRoomId);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        throw new Error('ROOM_NOT_FOUND');
      }
      const data = snap.data() as FirestoreDuelDoc;
      if (data.hostUserId === params.uid || data.guestUserId === params.uid) {
        return;
      }
      if (data.status !== 'waiting' || data.guestUserId !== '') {
        throw new Error('ROOM_FULL');
      }
      tx.update(ref, {
        guestUserId: params.uid,
        guestName: sanitizeName(params.playerName),
        guestCountryCode: sanitizeCountry(params.countryCode),
        status: 'playing',
        updatedAt: serverTimestamp(),
      });
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === 'ROOM_NOT_FOUND') {
      return { ok: false, error: `Salon ${cleanRoomId} introuvable ou expiré.` };
    }
    if (error instanceof Error && error.message === 'ROOM_FULL') {
      return { ok: false, error: `Le salon ${cleanRoomId} est déjà complet.` };
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeFirestoreDuelRoom(
  roomId: string,
  onRoom: (room: LiveDuelRoom) => void,
  onMissing: () => void,
  onError: (err: Error) => void
): () => void {
  const cleanRoomId = roomId.trim().toUpperCase();
  const path = `duelRooms/${cleanRoomId}`;
  return onSnapshot(
    doc(db, 'duelRooms', cleanRoomId),
    (snap) => {
      if (!snap.exists()) {
        onMissing();
        return;
      }
      onRoom(toLiveDuelRoom(snap.data() as FirestoreDuelDoc));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function submitFirestoreDuelRound(params: {
  roomId: string;
  uid: string;
  roundIndex: number;
  won: boolean;
  timeLeftRatio: number;
}): Promise<void> {
  const cleanRoomId = params.roomId.trim().toUpperCase();
  const path = `duelRooms/${cleanRoomId}`;
  const ref = doc(db, 'duelRooms', cleanRoomId);
  const clampedRatio = Math.max(0, Math.min(1, Number(params.timeLeftRatio) || 0));
  const roundPoints = params.won ? 100 + Math.round(clampedRatio * 50) : 0;

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const d = snap.data() as FirestoreDuelDoc;
      if (d.status !== 'playing' || d.currentRound !== params.roundIndex) return;

      const isHost = d.hostUserId === params.uid;
      const isGuest = d.guestUserId === params.uid;
      if (!isHost && !isGuest) return;

      if (isHost && d.hostRoundDone) return;
      if (isGuest && d.guestRoundDone) return;

      const nextHostScore = isHost ? d.hostScore + roundPoints : d.hostScore;
      const nextGuestScore = isGuest ? d.guestScore + roundPoints : d.guestScore;
      const bothDone = isHost ? d.guestRoundDone : d.hostRoundDone;

      if (bothDone) {
        if (d.currentRound >= 4) {
          const winnerUserId =
            nextHostScore > nextGuestScore
              ? d.hostUserId
              : nextGuestScore > nextHostScore
              ? d.guestUserId
              : '';
          if (isHost) {
            tx.update(ref, {
              hostScore: nextHostScore,
              hostRoundDone: true,
              hostLastCorrect: params.won,
              status: 'finished',
              winnerUserId,
              updatedAt: serverTimestamp(),
            });
          } else {
            tx.update(ref, {
              guestScore: nextGuestScore,
              guestRoundDone: true,
              guestLastCorrect: params.won,
              status: 'finished',
              winnerUserId,
              updatedAt: serverTimestamp(),
            });
          }
        } else {
          if (isHost) {
            tx.update(ref, {
              hostScore: nextHostScore,
              hostRoundDone: false,
              hostLastCorrect: params.won,
              guestRoundDone: false,
              currentRound: d.currentRound + 1,
              updatedAt: serverTimestamp(),
            });
          } else {
            tx.update(ref, {
              guestScore: nextGuestScore,
              guestRoundDone: false,
              guestLastCorrect: params.won,
              hostRoundDone: false,
              currentRound: d.currentRound + 1,
              updatedAt: serverTimestamp(),
            });
          }
        }
      } else {
        if (isHost) {
          tx.update(ref, {
            hostScore: nextHostScore,
            hostRoundDone: true,
            hostLastCorrect: params.won,
            updatedAt: serverTimestamp(),
          });
        } else {
          tx.update(ref, {
            guestScore: nextGuestScore,
            guestRoundDone: true,
            guestLastCorrect: params.won,
            updatedAt: serverTimestamp(),
          });
        }
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

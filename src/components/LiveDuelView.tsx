import { Copy, Check, Globe, Plus, Share2, Swords, Users, LogOut } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getChallengeById } from '../data/challengesGenerator';
import { getCountry } from '../data/countries';
import { Country, LiveDuelRoom } from '../types/game';
import { buildDuelRoomShareUrl, copyTextToClipboard, shareOrCopyLink } from '../utils/share';
import { ChallengeOutcome, ChallengeRunner } from './ChallengeRunner';

interface LiveDuelViewProps {
  myCountry: Country;
  playerName: string;
  clientId: string | null;
  onlineCount: number;
  isQueued: boolean;
  duelRoom: LiveDuelRoom | null;
  duelError: string | null;
  onJoinQueue: () => void;
  onCancelQueue: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  onSubmitRound: (roomId: string, roundIndex: number, won: boolean, timeLeftRatio: number) => void;
  onLeaveRoom: () => void;
}

export function LiveDuelView({
  myCountry,
  playerName,
  clientId,
  onlineCount,
  isQueued,
  duelRoom,
  duelError,
  onJoinQueue,
  onCancelQueue,
  onCreateRoom,
  onJoinRoom,
  onSubmitRound,
  onLeaveRoom,
}: LiveDuelViewProps) {
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const currentChallenge = useMemo(() => {
    if (!duelRoom || duelRoom.status !== 'playing') return null;
    const cid = duelRoom.challengeIds[duelRoom.currentRound];
    return cid ? getChallengeById(cid) : null;
  }, [duelRoom]);

  const me = duelRoom?.players.find((p) => p.clientId === clientId) ?? null;
  const opponent = duelRoom?.players.find((p) => p.clientId !== clientId) ?? null;

  const handleCopyCode = async (code: string) => {
    await copyTextToClipboard(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleShareInviteLink = async (roomId: string) => {
    const inviteUrl = buildDuelRoomShareUrl(roomId);
    await shareOrCopyLink({
      title: `Quiz — Duel Live (${roomId})`,
      text: `${playerName} (${myCountry.flag} ${myCountry.name}) vous défie en Duel Live sur Quiz ! Rejoignez le salon ${roomId} :`,
      url: inviteUrl,
    });
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2400);
  };

  if (duelRoom) {
    const myC = me ? getCountry(me.countryCode) : myCountry;
    const oppC = opponent ? getCountry(opponent.countryCode) : null;

    return (
      <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:py-8 space-y-6">
        {/* Duel Scoreboard Bar */}
        <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#121B2E] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{myC.flag}</span>
            <div>
              <div className="text-xs text-slate-400">{me?.playerName ?? playerName}</div>
              <div className="font-display text-lg font-bold text-white">{myC.name}</div>
            </div>
            <span className="ml-2 font-mono-num text-2xl font-extrabold text-amber-400">
              {me?.totalScore ?? 0}
            </span>
          </div>

          <div className="text-center">
            <div className="text-xs font-semibold text-slate-400">
              Salon {duelRoom.roomId} · Manche {duelRoom.currentRound + 1} /{' '}
              {duelRoom.challengeIds.length}
            </div>
            <div className="mt-1 font-display text-sm font-bold text-white">VS</div>
          </div>

          <div className="flex items-center gap-3 sm:justify-end">
            {opponent && oppC ? (
              <>
                <span className="mr-2 font-mono-num text-2xl font-extrabold text-sky-400">
                  {opponent.totalScore}
                </span>
                <div className="sm:text-right">
                  <div className="text-xs text-slate-400">{opponent.playerName}</div>
                  <div className="font-display text-lg font-bold text-white">{oppC.name}</div>
                </div>
                <span className="text-3xl leading-none">{oppC.flag}</span>
              </>
            ) : (
              <div className="text-sm text-slate-400">En attente d’un adversaire...</div>
            )}
          </div>
        </div>

        {/* Waiting Room */}
        {duelRoom.status === 'waiting' && (
          <div className="rounded-xl border border-white/10 bg-[#121B2E] p-8 text-center">
            <h2 className="font-display text-2xl font-bold text-white">
              Salon prêt — Partagez le lien ou le code avec un ami
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Dès que votre adversaire ouvre le lien ou saisit ce code, le duel de 5 manches démarre automatiquement.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <div className="rounded-xl border border-amber-400/50 bg-[#0B1120] px-6 py-3 font-mono-num text-3xl font-extrabold tracking-[0.25em] text-amber-400">
                {duelRoom.roomId}
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode(duelRoom.roomId)}
                className="flex h-12 items-center gap-2 rounded-xl border border-white/15 bg-[#162032] px-4 text-sm font-semibold text-white hover:border-amber-400 transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Code copié' : 'Copier code'}
              </button>
              <button
                type="button"
                onClick={() => handleShareInviteLink(duelRoom.roomId)}
                className="flex h-12 items-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-bold text-slate-950 hover:bg-amber-300 transition-colors"
              >
                {linkCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {linkCopied ? 'Lien copié !' : 'Partager le lien'}
              </button>
            </div>

            <div className="mx-auto mt-4 flex max-w-lg items-center gap-2 rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2">
              <input
                type="text"
                readOnly
                value={buildDuelRoomShareUrl(duelRoom.roomId)}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full bg-transparent font-mono-num text-xs text-slate-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleShareInviteLink(duelRoom.roomId)}
                className="shrink-0 text-xs font-semibold text-amber-400 hover:underline"
              >
                Copier
              </button>
            </div>

            <button
              type="button"
              onClick={onLeaveRoom}
              className="mt-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Quitter le salon
            </button>
          </div>
        )}

        {/* Active Synchronized Round */}
        {duelRoom.status === 'playing' && currentChallenge && (
          <div className="space-y-4">
            {me?.currentRoundDone ? (
              <div className="rounded-xl border border-white/10 bg-[#121B2E] p-8 text-center">
                <h3 className="font-display text-xl font-bold text-white">
                  Manche terminée ({me.lastRoundCorrect ? 'Réussie' : 'Échouée'})
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  En attente de la réponse de {opponent?.playerName ?? 'votre adversaire'} pour
                  passer à la manche suivante...
                </p>
              </div>
            ) : (
              <ChallengeRunner
                key={`${duelRoom.roomId}-${duelRoom.currentRound}-${currentChallenge.id}`}
                challenge={currentChallenge}
                myCountry={myC}
                rivalCountry={oppC}
                playerStreak={0}
                lastServerDelta={null}
                isSubmitting={false}
                duelMode={true}
                onComplete={(outcome: ChallengeOutcome) => {
                  onSubmitRound(
                    duelRoom.roomId,
                    duelRoom.currentRound,
                    outcome.won,
                    outcome.timeLeftRatio
                  );
                }}
              />
            )}
          </div>
        )}

        {/* Finished Duel Summary */}
        {duelRoom.status === 'finished' && (
          <div className="rounded-xl border border-white/10 bg-[#121B2E] p-8 text-center animate-pop-in">
            <h2 className="font-display text-3xl font-extrabold text-white">
              {duelRoom.winnerClientId === null
                ? 'Égalité parfaite !'
                : duelRoom.winnerClientId === clientId
                ? `Victoire pour ${myC.flag} ${myC.name} !`
                : `Défaite face à ${oppC?.flag ?? ''} ${oppC?.name ?? 'l’adversaire'}`}
            </h2>
            <p className="mt-2 text-base text-slate-300">
              Score final : <span className="font-mono-num font-bold text-white">{me?.totalScore ?? 0}</span>{' '}
              à{' '}
              <span className="font-mono-num font-bold text-white">{opponent?.totalScore ?? 0}</span>
            </p>

            {duelRoom.winnerClientId && (
              <div className="mt-4 text-sm font-semibold">
                {duelRoom.winnerClientId === clientId ? (
                  <span className="text-emerald-400">
                    +{duelRoom.countryPointsAwarded} pts ajoutés à {myC.name}
                    {oppC && myC.code !== oppC.code
                      ? ` · -${duelRoom.countryPointsLost} pts pour ${oppC.name}`
                      : ''}
                  </span>
                ) : (
                  <span className="text-rose-400">
                    -{duelRoom.countryPointsLost} pts retirés à {myC.name}
                    {oppC && myC.code !== oppC.code
                      ? ` · +${duelRoom.countryPointsAwarded} pts pour ${oppC.name}`
                      : ''}
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onLeaveRoom}
              className="mt-6 rounded-xl bg-amber-400 px-6 py-3 font-display text-sm font-extrabold text-slate-950 hover:bg-amber-300 transition-colors"
            >
              Revenir au lobby Duel Live
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:py-8 space-y-6">
      <div className="rounded-xl border border-white/10 bg-[#121B2E] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              Duel International en Direct (5 Manches)
            </h1>
            <p className="mt-1.5 text-sm text-slate-300 max-w-2xl">
              Affrontez un autre joueur en temps réel sur 5 défis identiques. Le vainqueur rapporte{' '}
              <span className="font-mono-num font-bold text-emerald-400">+60 pts</span> à son pays
              et retire <span className="font-mono-num font-bold text-rose-400">-35 pts</span> au
              pays adverse.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 shrink-0">
            <Users className="h-4 w-4 text-emerald-400" />
            <span className="font-mono-num">{onlineCount}</span> connecté(s)
          </div>
        </div>

        {duelError && (
          <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">
            {duelError}
          </div>
        )}

        <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Option 1: Matchmaking */}
          <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#162032] p-5">
            <div>
              <Globe className="h-6 w-6 text-amber-400" />
              <h2 className="mt-3 font-display text-lg font-bold text-white">
                Matchmaking Mondial
              </h2>
              <p className="mt-1.5 text-sm text-slate-400">
                Affrontez automatiquement le prochain joueur en ligne représentant une autre nation.
              </p>
            </div>
            <div className="mt-5">
              {isQueued ? (
                <button
                  type="button"
                  onClick={onCancelQueue}
                  className="w-full rounded-lg border border-rose-400/50 bg-rose-500/15 py-2.5 text-sm font-bold text-rose-200 hover:bg-rose-500/25 transition-colors"
                >
                  Recherche en cours… Annuler
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onJoinQueue}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300 transition-colors"
                >
                  <Swords className="h-4 w-4" />
                  Trouver un adversaire
                </button>
              )}
            </div>
          </div>

          {/* Option 2: Create Private Salon */}
          <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#162032] p-5">
            <div>
              <Plus className="h-6 w-6 text-sky-400" />
              <h2 className="mt-3 font-display text-lg font-bold text-white">
                Créer un salon privé
              </h2>
              <p className="mt-1.5 text-sm text-slate-400">
                Obtenez un code à 4 lettres et défiez directement un ami sur un autre appareil ou onglet.
              </p>
            </div>
            <button
              type="button"
              onClick={onCreateRoom}
              className="mt-5 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
            >
              Créer un salon
            </button>
          </div>

          {/* Option 3: Join Room by Code */}
          <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#162032] p-5">
            <div>
              <Users className="h-6 w-6 text-emerald-400" />
              <h2 className="mt-3 font-display text-lg font-bold text-white">
                Rejoindre un salon
              </h2>
              <p className="mt-1.5 text-sm text-slate-400">
                Entrez le code à 4 caractères transmis par votre adversaire.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (joinCode.trim().length >= 3) onJoinRoom(joinCode.trim());
              }}
              className="mt-5 flex gap-2"
            >
              <input
                type="text"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="CODE"
                className="w-full rounded-lg border border-white/15 bg-[#0B1120] px-3 py-2 font-mono-num text-sm font-bold tracking-widest text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400 whitespace-nowrap shrink-0 transition-colors"
              >
                Rejoindre
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

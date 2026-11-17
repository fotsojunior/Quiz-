import { ArrowLeftRight, Flame, Play, Share2, Shuffle, Swords, Trophy, X } from 'lucide-react';
import { CHALLENGE_CATEGORIES } from '../data/challengesGenerator';
import { getCountry } from '../data/countries';
import {
  Challenge,
  ChallengeCategory,
  Country,
  CountryStanding,
  Difficulty,
  ScoreEvent,
  SharedChallengeInfo,
} from '../types/game';
import { ChallengeOutcome, ChallengeRunner } from './ChallengeRunner';

interface ArenaViewProps {
  myCountry: Country;
  myStanding?: CountryStanding;
  myRank: number;
  rivalCountry: Country | null;
  rivalStanding?: CountryStanding;
  rivalRank: number | null;
  selectedCategory: ChallengeCategory | 'all';
  activeChallenge: Challenge | null;
  playerStreak: number;
  userPoints: number;
  answeredCount: number;
  currentTimeLimitSec: number;
  currentDifficulty: Difficulty;
  lastServerDelta: { countryDelta: number; rivalDelta: number } | null;
  isSubmitting: boolean;
  topStandings: CountryStanding[];
  recentEvents: ScoreEvent[];
  sharedChallengeContext: {
    challengeId: number;
    creatorName: string;
    creatorCountryCode: string;
    info: SharedChallengeInfo | null;
  } | null;
  onDismissSharedContext: () => void;
  onShareChallenge: (
    challengeId: number,
    outcome?: { won: boolean; pointsDelta: number }
  ) => Promise<{ url: string; status: 'shared' | 'copied' | 'manual' } | null>;
  onSelectCategory: (cat: ChallengeCategory | 'all') => void;
  onStartChallenge: (cat?: ChallengeCategory | 'all') => void;
  onCompleteChallenge: (outcome: ChallengeOutcome) => void;
  onOpenMyCountryPicker: () => void;
  onOpenRivalPicker: () => void;
  onClearRival: () => void;
  onOpenLeaderboard: () => void;
  onOpenLiveDuel: () => void;
}

export function ArenaView({
  myCountry,
  myStanding,
  myRank,
  rivalCountry,
  rivalStanding,
  rivalRank,
  selectedCategory,
  activeChallenge,
  playerStreak,
  userPoints,
  answeredCount,
  currentTimeLimitSec,
  currentDifficulty,
  lastServerDelta,
  isSubmitting,
  topStandings,
  recentEvents,
  sharedChallengeContext,
  onDismissSharedContext,
  onShareChallenge,
  onSelectCategory,
  onStartChallenge,
  onCompleteChallenge,
  onOpenMyCountryPicker,
  onOpenRivalPicker,
  onClearRival,
  onOpenLeaderboard,
  onOpenLiveDuel,
}: ArenaViewProps) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8">
      {/* Main Country vs Country Duel Banner */}
      <section className="rounded-xl border border-white/10 bg-[#121B2E] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Player Nation */}
          <div className="flex items-center gap-4">
            <span className="text-4xl sm:text-5xl leading-none select-none" aria-hidden="true">
              {myCountry.flag}
            </span>
            <div>
              <div className="text-xs font-medium text-slate-400">
                Votre nation · Rang mondial #{myRank}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="font-display text-2xl font-extrabold text-white">
                  {myCountry.name}
                </div>
                <button
                  type="button"
                  onClick={onOpenMyCountryPicker}
                  className="text-xs font-semibold text-amber-400 hover:underline whitespace-nowrap shrink-0"
                >
                  Changer de pays
                </button>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="font-mono-num font-bold text-amber-400">
                  {(myStanding?.points ?? 1000).toLocaleString('fr-FR')} pts
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num text-emerald-400">
                  {myStanding?.wins ?? 0} V
                </span>
                <span aria-hidden="true">/</span>
                <span className="font-mono-num text-rose-400">
                  {myStanding?.losses ?? 0} D
                </span>
                {playerStreak > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-mono-num font-bold text-amber-300">
                      <Flame className="h-3.5 w-3.5" />
                      Série {playerStreak}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stakes, Progression & Live Duel Shortcut */}
          <div className="flex flex-col items-start lg:items-center gap-1.5 border-y border-white/10 py-3 lg:border-y-0 lg:py-0">
            <div className="text-xs font-semibold text-slate-300">
              Enjeu du défi :{' '}
              <span className="font-mono-num text-emerald-400">+15 à +45 pts</span> si victoire
              <span className="mx-1.5 text-slate-500">/</span>
              <span className="font-mono-num text-rose-400">-15 pts</span> si défaite
            </div>
            <div className="text-xs text-slate-400">
              Mes points :{' '}
              <span className="font-mono-num font-bold text-amber-400">
                {userPoints.toLocaleString('fr-FR')}
              </span>
              <span className="mx-1.5 text-slate-600">·</span>
              Parcours{' '}
              <span className="font-mono-num font-semibold text-slate-200">
                {answeredCount}
              </span>{' '}
              réponses
              <span className="mx-1.5 text-slate-600">·</span>
              Niveau{' '}
              <span className="font-semibold capitalize text-amber-300">
                {currentDifficulty}
              </span>
              <span className="mx-1.5 text-slate-600">·</span>
              Chrono{' '}
              <span className="font-mono-num font-bold text-slate-200">
                {currentTimeLimitSec}s
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={onOpenLiveDuel}
                className="flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/20 whitespace-nowrap shrink-0 transition-colors"
              >
                <Swords className="h-3.5 w-3.5" />
                Duel Live 1v1 (Enjeu +60 / -35 pts)
              </button>
            </div>
          </div>

          {/* Rival Country Target */}
          <div className="flex items-center justify-between gap-4 lg:justify-end">
            {rivalCountry ? (
              <div className="flex items-center gap-3.5">
                <div className="lg:text-right">
                  <div className="text-xs font-medium text-slate-400">
                    Pays ciblé · Rang #{rivalRank ?? '—'}
                  </div>
                  <div className="font-display text-xl font-bold text-white">
                    {rivalCountry.name}
                  </div>
                  <div className="mt-0.5 flex items-center lg:justify-end gap-2 text-xs text-slate-300">
                    <span className="font-mono-num font-bold text-slate-200">
                      {(rivalStanding?.points ?? 1000).toLocaleString('fr-FR')} pts
                    </span>
                    <button
                      type="button"
                      onClick={onOpenRivalPicker}
                      className="text-amber-400 hover:underline font-medium"
                    >
                      Changer
                    </button>
                    <span className="text-slate-600" aria-hidden="true">
                      ·
                    </span>
                    <button
                      type="button"
                      onClick={onClearRival}
                      className="text-slate-400 hover:text-white font-medium"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
                <span className="text-4xl leading-none select-none" aria-hidden="true">
                  {rivalCountry.flag}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenRivalPicker}
                className="flex items-center gap-2 rounded-lg border border-white/15 bg-[#162032] px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-amber-400/60 hover:text-white whitespace-nowrap shrink-0 transition-colors"
              >
                <ArrowLeftRight className="h-4 w-4 text-amber-400" />
                Cibler un pays rival
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main 2-column layout (Arena Stage + Live World Ranking Sidebar) */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left/Center Play Stage (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Category Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-[#121B2E] p-1.5">
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              Tous
            </button>
            {CHALLENGE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {cat.shortLabel}
              </button>
            ))}
          </div>

          {/* Shared Challenge Invitation Banner */}
          {sharedChallengeContext && (
            <div className="flex flex-col gap-2.5 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Share2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div className="text-sm">
                  <div className="font-display font-bold text-white">
                    Défi #{String(sharedChallengeContext.challengeId).padStart(5, '0')} partagé par{' '}
                    {sharedChallengeContext.creatorName} (
                    {getCountry(sharedChallengeContext.creatorCountryCode).flag}{' '}
                    {getCountry(sharedChallengeContext.creatorCountryCode).name})
                  </div>
                  <div className="mt-0.5 text-xs text-amber-100/90">
                    {sharedChallengeContext.info?.creatorWon === true
                      ? `${sharedChallengeContext.creatorName} a réussi ce défi (+${sharedChallengeContext.info.creatorPointsDelta} pts). Faites mieux !`
                      : sharedChallengeContext.info?.creatorWon === false
                      ? `${sharedChallengeContext.creatorName} a échoué sur ce défi. Montrez l’exemple !`
                      : 'Relevez ce défi et comparez votre score avec celui de votre ami.'}
                    {sharedChallengeContext.info &&
                      sharedChallengeContext.info.attempts.length > 0 && (
                        <span className="ml-2 text-slate-300">
                          · {sharedChallengeContext.info.attempts.length} participation(s) enregistrée(s)
                        </span>
                      )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onDismissSharedContext}
                className="inline-flex items-center gap-1 self-start rounded-lg border border-white/15 bg-[#0B1120] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white sm:self-center shrink-0"
              >
                <X className="h-3.5 w-3.5" />
                Fermer
              </button>
            </div>
          )}

          {/* Active Challenge or Ready Launch Card */}
          {activeChallenge ? (
            <>
              <ChallengeRunner
                challenge={activeChallenge}
                myCountry={myCountry}
                rivalCountry={rivalCountry}
                playerStreak={playerStreak}
                lastServerDelta={lastServerDelta}
                isSubmitting={isSubmitting}
                onComplete={onCompleteChallenge}
                onNext={() => onStartChallenge()}
                onShareChallenge={onShareChallenge}
              />
              <p className="text-center text-xs text-slate-500">
                Astuce clavier : répondez avec les touches A–D ou 1–4, puis appuyez sur Entrée pour passer à la question suivante.
              </p>
            </>
          ) : (
            <div className="rounded-xl border border-white/10 bg-[#121B2E] p-6 sm:p-10 text-center">
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white text-balance">
                Défendez les couleurs de {myCountry.name}
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-base text-slate-300 leading-relaxed">
                Plus de 12 500 défis d’énigmes, réflexion, concentration, rapidité, création et
                devinettes mondiales. Chaque victoire fait grimper votre pays ; chaque erreur lui
                retire des points.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onStartChallenge()}
                  className="flex items-center gap-2.5 rounded-xl bg-amber-400 px-7 py-3.5 font-display text-base font-extrabold text-slate-950 hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
                >
                  <Play className="h-5 w-5 fill-current" />
                  Lancer un défi
                </button>
                <button
                  type="button"
                  onClick={() => onStartChallenge('all')}
                  className="flex items-center gap-2 rounded-xl border border-white/15 bg-[#162032] px-5 py-3.5 text-sm font-semibold text-white hover:border-white/30 transition-colors whitespace-nowrap shrink-0"
                >
                  <Shuffle className="h-4 w-4 text-amber-400" />
                  Défi aléatoire mondial
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Live Standings & World Feed Sidebar (4 cols) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Top Nations Live Table */}
          <div className="rounded-xl border border-white/10 bg-[#121B2E] p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                <h2 className="font-display text-base font-bold text-white">
                  Top Mondial en direct
                </h2>
              </div>
              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="text-xs font-semibold text-amber-400 hover:underline whitespace-nowrap shrink-0"
              >
                Voir les 195 pays
              </button>
            </div>

            <div className="mt-3 divide-y divide-white/5">
              {topStandings.slice(0, 10).map((item, idx) => {
                const c = getCountry(item.code);
                const isMe = c.code === myCountry.code;
                const isRival = rivalCountry?.code === c.code;
                return (
                  <div
                    key={c.code}
                    className={`flex items-center justify-between gap-3 py-2.5 px-2 rounded-lg ${
                      isMe ? 'bg-amber-400/10' : isRival ? 'bg-rose-500/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`font-mono-num w-6 text-xs font-bold ${
                          idx === 0
                            ? 'text-amber-400'
                            : idx === 1
                            ? 'text-slate-200'
                            : idx === 2
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-lg leading-none shrink-0" aria-hidden="true">
                        {c.flag}
                      </span>
                      <span className="truncate text-sm font-medium text-white">
                        {c.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.lastDelta !== 0 && (
                        <span
                          className={`font-mono-num text-[11px] font-semibold ${
                            item.lastDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {item.lastDelta > 0 ? `+${item.lastDelta}` : item.lastDelta}
                        </span>
                      )}
                      <span className="font-mono-num text-sm font-bold text-slate-100">
                        {item.points.toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Global Results Feed */}
          <div className="rounded-xl border border-white/10 bg-[#121B2E] p-5">
            <h2 className="font-display text-base font-bold text-white border-b border-white/10 pb-3">
              Derniers résultats mondiaux
            </h2>

            {recentEvents.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">
                Aucun score enregistré pour le moment. Soyez le premier à faire marquer votre pays !
              </p>
            ) : (
              <div className="mt-3 divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                {recentEvents.slice(0, 12).map((evt) => {
                  const c = getCountry(evt.countryCode);
                  const rival = evt.rivalCode ? getCountry(evt.rivalCode) : null;
                  return (
                    <div key={evt.id} className="py-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-200 truncate">
                          {c.flag} {evt.playerName} ({c.name})
                        </span>
                        <span
                          className={`font-mono-num font-bold shrink-0 ${
                            evt.won ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {evt.countryDelta >= 0 ? `+${evt.countryDelta}` : evt.countryDelta} pts
                        </span>
                      </div>
                      <div className="mt-0.5 text-slate-400">
                        Défi #{evt.challengeId}
                        {rival && (
                          <span>
                            {' '}
                            · Contre {rival.flag} {rival.name} ({evt.rivalDelta >= 0 ? `+${evt.rivalDelta}` : evt.rivalDelta})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

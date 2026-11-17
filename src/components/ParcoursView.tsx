import {
  Award,
  Check,
  CheckCircle2,
  CloudCheck,
  Copy,
  Download,
  Flame,
  History,
  LogIn,
  LogOut,
  Play,
  Share2,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import {
  CHALLENGE_CATEGORIES,
  TOTAL_CHALLENGES,
  getDifficultyTierForProgress,
  getTimeLimitForProgress,
} from '../data/challengesGenerator';
import { getCountry } from '../data/countries';
import { Country, UserProfile } from '../types/game';
import { copyTextToClipboard } from '../utils/share';

interface ParcoursViewProps {
  profile: UserProfile;
  myCountry: Country;
  authUser: { uid: string; displayName: string | null; email: string | null } | null;
  isSigningIn: boolean;
  authError: string | null;
  onSignInGoogle: () => void;
  onSignOutGoogle: () => void;
  onPlaySpecificChallenge: (id: number) => void;
  onShareChallengeId: (id: number) => void;
  onRestoreSyncCode: (code: string) => Promise<{ ok: boolean; error?: string }>;
  onOpenCountryPicker: () => void;
}

export function ParcoursView({
  profile,
  myCountry,
  authUser,
  isSigningIn,
  authError,
  onSignInGoogle,
  onSignOutGoogle,
  onPlaySpecificChallenge,
  onShareChallengeId,
  onRestoreSyncCode,
  onOpenCountryPicker,
}: ParcoursViewProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [restoreInput, setRestoreInput] = useState('');
  const [restoreStatus, setRestoreStatus] = useState<{
    type: 'ok' | 'error';
    message: string;
  } | null>(null);
  const [restoring, setRestoring] = useState(false);

  const totalPlayed = profile.wins + profile.losses;
  const winRate = totalPlayed > 0 ? Math.round((profile.wins / totalPlayed) * 100) : 0;
  const currentDifficulty = getDifficultyTierForProgress(profile.answeredCount);
  const currentTimer = getTimeLimitForProgress(profile.answeredCount);

  const handleCopySyncCode = async () => {
    await copyTextToClipboard(profile.syncCode);
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = restoreInput.trim().toUpperCase();
    if (!trimmed) return;
    setRestoring(true);
    setRestoreStatus(null);
    const res = await onRestoreSyncCode(trimmed);
    setRestoring(false);
    if (res.ok) {
      setRestoreInput('');
      setRestoreStatus({
        type: 'ok',
        message: 'Parcours et points restaurés avec succès !',
      });
    } else {
      setRestoreStatus({
        type: 'error',
        message: res.error || 'Code introuvable.',
      });
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8 space-y-6">
      {/* Top User Identity & Points Summary */}
      <section className="rounded-xl border border-white/10 bg-[#121B2E] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="text-4xl sm:text-5xl leading-none select-none" aria-hidden="true">
              {myCountry.flag}
            </span>
            <div>
              <div className="text-xs font-medium text-slate-400">
                Profil enregistré · {myCountry.name}
              </div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                  {profile.playerName}
                </h1>
                <button
                  type="button"
                  onClick={onOpenCountryPicker}
                  className="text-xs font-semibold text-amber-400 hover:underline whitespace-nowrap shrink-0"
                >
                  Modifier profil
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Palier actuel : <span className="capitalize font-semibold text-amber-300">{currentDifficulty}</span> · Chrono{' '}
                <span className="font-mono-num font-semibold text-slate-200">{currentTimer}s</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-[#0B1120] px-4 py-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                Mes points
              </div>
              <div className="mt-1 font-mono-num text-xl font-extrabold text-amber-400">
                {profile.userPoints.toLocaleString('fr-FR')}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0B1120] px-4 py-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Award className="h-3.5 w-3.5 text-emerald-400" />
                Réussite
              </div>
              <div className="mt-1 font-mono-num text-xl font-extrabold text-white">
                {winRate}%{' '}
                <span className="text-xs font-normal text-slate-400">
                  ({profile.wins}/{totalPlayed})
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0B1120] px-4 py-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                Record série
              </div>
              <div className="mt-1 font-mono-num text-xl font-extrabold text-white">
                {profile.bestStreak}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0B1120] px-4 py-3">
              <div className="text-xs text-slate-400">Défis résolus</div>
              <div className="mt-1 font-mono-num text-xl font-extrabold text-emerald-400">
                {profile.solvedIds.length}{' '}
                <span className="text-xs font-normal text-slate-500">
                  / {TOTAL_CHALLENGES.toLocaleString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Google Cloud Firestore Sync, Category Mastery & Sync Code (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-xl border border-white/10 bg-[#121B2E] p-5 space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Compte Google & Cloud Firestore
                </h2>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  {authUser
                    ? 'Votre progression, vos points et votre parcours sont sauvegardés dans votre base Cloud Firestore.'
                    : 'Connectez votre compte Google pour sauvegarder automatiquement vos points et retrouver votre parcours sur tous vos appareils.'}
                </p>
              </div>
              {authUser && (
                <CloudCheck className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
              )}
            </div>

            {authUser ? (
              <div className="flex flex-col gap-3 rounded-lg border border-emerald-400/25 bg-[#0B1120] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">
                    {authUser.displayName || profile.playerName}
                  </div>
                  {authUser.email && (
                    <div className="truncate text-xs text-slate-400">{authUser.email}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onSignOutGoogle}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-[#162032] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-rose-400/60 hover:text-white whitespace-nowrap shrink-0 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Déconnexion
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignInGoogle}
                disabled={isSigningIn}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-50 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                {isSigningIn ? 'Connexion en cours…' : 'Continuer avec Google'}
              </button>
            )}

            {authError && (
              <p className="text-xs font-medium text-rose-400">{authError}</p>
            )}
          </section>

          <section className="rounded-xl border border-white/10 bg-[#121B2E] p-5">
            <h2 className="font-display text-lg font-bold text-white border-b border-white/10 pb-3">
              Progression par catégorie
            </h2>
            <div className="mt-4 space-y-3.5">
              {CHALLENGE_CATEGORIES.map((cat) => {
                const stats = profile.categoryStats?.[cat.id] ?? { played: 0, won: 0, points: 0 };
                const pct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{cat.shortLabel}</span>
                      <span className="font-mono-num text-slate-400">
                        {stats.won}/{stats.played} réussis ·{' '}
                        <span className="text-amber-400 font-bold">{stats.points} pts</span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#0B1120]">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Transferable Save Code */}
          <section className="rounded-xl border border-white/10 bg-[#121B2E] p-5 space-y-4">
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Code de sauvegarde multi-appareils
              </h2>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Vos points et votre parcours sont enregistrés automatiquement. Conservez ce code
                pour retrouver votre progression sur un autre téléphone ou navigateur.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-amber-400/40 bg-[#0B1120] px-3.5 py-2.5 font-mono-num text-sm font-bold tracking-wider text-amber-300">
                {profile.syncCode}
              </div>
              <button
                type="button"
                onClick={handleCopySyncCode}
                className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#162032] px-3.5 py-2.5 text-xs font-semibold text-white hover:border-amber-400 whitespace-nowrap shrink-0 transition-colors"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copier
                  </>
                )}
              </button>
            </div>

            <form onSubmit={handleRestoreSubmit} className="pt-2 border-t border-white/10 space-y-2.5">
              <label className="block text-xs font-semibold text-slate-300">
                Charger un parcours existant
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={restoreInput}
                  onChange={(e) => setRestoreInput(e.target.value.toUpperCase())}
                  placeholder="QZ-XXXX-XXXX"
                  maxLength={20}
                  className="w-full rounded-lg border border-white/15 bg-[#0B1120] px-3 py-2 font-mono-num text-xs font-bold tracking-wider text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={restoring || restoreInput.trim().length < 5}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-40 whitespace-nowrap shrink-0 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Restaurer
                </button>
              </div>
              {restoreStatus && (
                <p
                  className={`text-xs font-medium ${
                    restoreStatus.type === 'ok' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {restoreStatus.message}
                </p>
              )}
            </form>
          </section>
        </div>

        {/* Recent Journey History (7 cols) */}
        <section className="lg:col-span-7 rounded-xl border border-white/10 bg-[#121B2E] p-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-amber-400" />
              <h2 className="font-display text-lg font-bold text-white">
                Historique de votre parcours
              </h2>
            </div>
            <span className="font-mono-num text-xs text-slate-400">
              {profile.answeredCount} défi(s) joué(s)
            </span>
          </div>

          {!profile.history || profile.history.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Terminez votre premier défi pour voir votre historique détaillé ici.
            </div>
          ) : (
            <div className="mt-3 divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {profile.history.map((item) => {
                const c = getCountry(item.countryCode);
                const modeLabel =
                  item.mode === 'duel'
                    ? 'Duel Live'
                    : item.mode === 'shared'
                    ? 'Défi partagé'
                    : 'Solo';
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {item.won ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                      ) : (
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="font-mono-num font-bold text-amber-400">
                            #{String(item.challengeId).padStart(5, '0')}
                          </span>
                          <span>·</span>
                          <span className="font-semibold text-slate-300">{modeLabel}</span>
                          <span>·</span>
                          <span>
                            {c.flag} {c.name}
                          </span>
                        </div>
                        <div className="truncate font-display text-sm font-bold text-white">
                          {item.title}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pl-8 sm:pl-0">
                      <span
                        className={`font-mono-num text-sm font-bold ${
                          item.userPointsDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.userPointsDelta >= 0
                          ? `+${item.userPointsDelta}`
                          : item.userPointsDelta}{' '}
                        pts
                      </span>
                      <button
                        type="button"
                        onClick={() => onPlaySpecificChallenge(item.challengeId)}
                        title="Rejouer ce défi"
                        className="flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-[#162032] px-2.5 text-xs font-semibold text-slate-200 hover:border-amber-400/60 transition-colors"
                      >
                        <Play className="h-3 w-3" />
                        Rejouer
                      </button>
                      <button
                        type="button"
                        onClick={() => onShareChallengeId(item.challengeId)}
                        title="Partager ce défi"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#162032] text-slate-300 hover:border-amber-400/60 hover:text-white transition-colors"
                        aria-label={`Partager le défi ${item.challengeId}`}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

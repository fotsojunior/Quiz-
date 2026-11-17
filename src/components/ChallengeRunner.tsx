import {
  Check,
  CheckCircle2,
  RotateCcw,
  Share2,
  Volume2,
  VolumeX,
  XCircle,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CHALLENGE_CATEGORIES,
  getPipeBaseMask,
  isPipeCircuitSolved,
  rotatePipeMask,
} from '../data/challengesGenerator';
import {
  Challenge,
  Country,
  LogicArrangeChallenge,
  MemoryGridChallenge,
  OrderTapChallenge,
  PipeConnectChallenge,
  SimonSeqChallenge,
  SpotDiffChallenge,
  StroopChallenge,
  SymmetryDrawChallenge,
  WordScrambleChallenge,
} from '../types/game';
import { soundFX } from '../utils/sound';

export interface ChallengeOutcome {
  challengeId: number;
  won: boolean;
  timeLeftRatio: number;
}

interface ChallengeRunnerProps {
  challenge: Challenge;
  myCountry: Country;
  rivalCountry: Country | null;
  playerStreak: number;
  lastServerDelta: { countryDelta: number; rivalDelta: number } | null;
  isSubmitting: boolean;
  duelMode?: boolean;
  onComplete: (outcome: ChallengeOutcome) => void;
  onNext?: () => void;
  onShareChallenge?: (
    challengeId: number,
    outcome?: { won: boolean; pointsDelta: number }
  ) => Promise<{ url: string; status: 'shared' | 'copied' | 'manual' } | null>;
}

function ShapeSvg({
  shape,
  color,
  rotation = 0,
  label,
}: {
  shape: string;
  color: string;
  rotation?: number;
  label?: string;
}) {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <svg
        viewBox="0 0 40 40"
        className="w-8 h-8"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {shape === 'circle' && (
          <circle cx="20" cy="20" r="14" fill="none" stroke={color} strokeWidth="3.2" />
        )}
        {shape === 'square' && (
          <rect x="7" y="7" width="26" height="26" rx="4" fill="none" stroke={color} strokeWidth="3.2" />
        )}
        {shape === 'triangle' && (
          <polygon points="20,6 34,32 6,32" fill="none" stroke={color} strokeWidth="3.2" strokeLinejoin="round" />
        )}
        {shape === 'diamond' && (
          <polygon points="20,5 35,20 20,35 5,20" fill="none" stroke={color} strokeWidth="3.2" strokeLinejoin="round" />
        )}
        {shape === 'hex' && (
          <polygon
            points="20,5 33,12.5 33,27.5 20,35 7,27.5 7,12.5"
            fill="none"
            stroke={color}
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
        )}
      </svg>
      {label && (
        <span
          className="absolute text-xs font-bold select-none"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export function ChallengeRunner({
  challenge,
  myCountry,
  rivalCountry,
  playerStreak,
  lastServerDelta,
  isSubmitting,
  duelMode = false,
  onComplete,
  onNext,
  onShareChallenge,
}: ChallengeRunnerProps) {
  const [timeLeftMs, setTimeLeftMs] = useState(challenge.timeLimitSec * 1000);
  const [finished, setFinished] = useState<{ won: boolean; reason: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [muted, setMuted] = useState(soundFX.muted);
  const [shareFeedback, setShareFeedback] = useState<{
    url: string;
    status: 'shared' | 'copied' | 'manual';
  } | null>(null);

  const completedRef = useRef(false);
  const startTsRef = useRef(Date.now());

  const categoryLabel =
    CHALLENGE_CATEGORIES.find((c) => c.id === challenge.category)?.shortLabel ??
    challenge.category;

  const finalize = useCallback(
    (won: boolean, reason: string) => {
      if (completedRef.current) return;
      completedRef.current = true;
      const elapsed = Date.now() - startTsRef.current;
      const totalMs = challenge.timeLimitSec * 1000;
      const ratio = Math.max(0, Math.min(1, (totalMs - elapsed) / totalMs));

      if (won) {
        if (playerStreak >= 2) soundFX.playCombo();
        else soundFX.playSuccess();
      } else {
        soundFX.playFail();
      }

      setFinished({ won, reason });
      onComplete({
        challengeId: challenge.id,
        won,
        timeLeftRatio: ratio,
      });
    },
    [challenge.id, challenge.timeLimitSec, onComplete, playerStreak]
  );

  // Reset state cleanly when challenge changes
  useEffect(() => {
    completedRef.current = false;
    startTsRef.current = Date.now();
    setTimeLeftMs(challenge.timeLimitSec * 1000);
    setFinished(null);
    setShowHint(false);
    setShareFeedback(null);
  }, [challenge.id, challenge.timeLimitSec]);

  const handleTriggerShare = useCallback(async () => {
    if (!onShareChallenge) return;
    const outcome = finished
      ? {
          won: finished.won,
          pointsDelta:
            lastServerDelta?.countryDelta ?? (finished.won ? challenge.basePoints : -15),
        }
      : undefined;
    const res = await onShareChallenge(challenge.id, outcome);
    if (res) {
      setShareFeedback(res);
    }
  }, [challenge.basePoints, challenge.id, finished, lastServerDelta, onShareChallenge]);

  // Master countdown timer
  useEffect(() => {
    if (finished) return;
    const totalMs = challenge.timeLimitSec * 1000;
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTsRef.current;
      const remaining = Math.max(0, totalMs - elapsed);
      setTimeLeftMs(remaining);
      if (remaining <= 0) {
        window.clearInterval(interval);
        finalize(false, 'Temps écoulé !');
      }
    }, 50);
    return () => window.clearInterval(interval);
  }, [challenge.id, challenge.timeLimitSec, finished, finalize]);

  // Press Enter to advance after a finished question
  useEffect(() => {
    if (!finished || !onNext || isSubmitting) return;
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === 'Enter' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finished, isSubmitting, onNext]);

  const timePct = Math.max(0, Math.min(1, timeLeftMs / (challenge.timeLimitSec * 1000)));
  const secondsDisplay = (timeLeftMs / 1000).toFixed(1);

  return (
    <div className="rounded-xl border border-white/10 bg-[#121B2E] p-5 sm:p-6 shadow-xl">
      {/* Challenge metadata row — clean unboxed typography */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="font-mono-num font-bold text-amber-400">
            Défi #{String(challenge.id).padStart(5, '0')}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-semibold text-slate-200">{categoryLabel}</span>
          <span aria-hidden="true">·</span>
          <span className="capitalize">{challenge.difficulty}</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-400 font-mono-num">
            +{challenge.basePoints} à +{challenge.basePoints + 30} pts
          </span>
          <span aria-hidden="true">/</span>
          <span className="text-rose-400 font-mono-num">-15 pts</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={`font-mono-num text-sm font-bold ${
              timePct < 0.25 ? 'text-rose-400' : 'text-slate-200'
            }`}
          >
            {secondsDisplay}s
          </span>
          {!duelMode && onShareChallenge && (
            <button
              type="button"
              onClick={handleTriggerShare}
              title="Partager ce défi avec un ami"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-[#0B1120] px-3 text-xs font-semibold text-slate-200 hover:border-amber-400/60 hover:text-white transition-colors"
            >
              {shareFeedback?.status === 'copied' || shareFeedback?.status === 'shared' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-300">Lien prêt</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Partager</span>
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              soundFX.muted = !muted;
              setMuted(soundFX.muted);
            }}
            aria-label={muted ? 'Activer le son' : 'Couper le son'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#0B1120] text-slate-300 hover:text-white transition-colors"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {shareFeedback && (
        <div className="mt-3 flex flex-col gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-medium text-amber-100">
            {shareFeedback.status === 'shared'
              ? 'Défi partagé ! Vous pouvez aussi copier le lien :'
              : shareFeedback.status === 'copied'
              ? 'Lien du défi copié ! Envoyez-le à un ami :'
              : 'Copiez ce lien pour envoyer le défi :'}
          </span>
          <div className="flex items-center gap-2 min-w-0 sm:max-w-sm w-full">
            <input
              type="text"
              readOnly
              value={shareFeedback.url}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full rounded border border-white/15 bg-[#0B1120] px-2.5 py-1 font-mono-num text-[11px] text-slate-200 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Compositor-only countdown progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full w-full origin-left transition-colors duration-200 ${
            timePct < 0.25
              ? 'bg-rose-500'
              : timePct < 0.5
              ? 'bg-amber-400'
              : 'bg-emerald-400'
          }`}
          style={{ transform: `scaleX(${timePct})` }}
        />
      </div>

      {/* Challenge Title & Prompt */}
      <div className="mt-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white text-balance">
            {challenge.title}
          </h2>
          {challenge.kind === 'mcq' && challenge.hint && !finished && (
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#162032] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-amber-400/50 hover:text-white whitespace-nowrap shrink-0 transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
              Indice
            </button>
          )}
        </div>

        <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-slate-200">
          {challenge.prompt}
        </p>

        {showHint && challenge.kind === 'mcq' && challenge.hint && (
          <p className="mt-2.5 rounded-lg bg-amber-400/10 border border-amber-400/25 px-3.5 py-2 text-sm text-amber-200">
            Indice : {challenge.hint}
          </p>
        )}
      </div>

      {/* Interactive Challenge Mechanic */}
      <div className="mt-6">
        {challenge.kind === 'mcq' && (
          <McqBoard
            challenge={challenge}
            finished={finished !== null}
            onResolve={finalize}
          />
        )}
        {challenge.kind === 'memory-grid' && (
          <MemoryGridBoard
            challenge={challenge}
            finished={finished !== null}
            onResolve={finalize}
          />
        )}
        {challenge.kind === 'spot-diff' && (
          <SpotDiffBoard
            challenge={challenge}
            finished={finished !== null}
            onResolve={finalize}
          />
        )}
        {challenge.kind === 'simon-seq' && (
          <SimonSeqBoard
            challenge={challenge}
            finished={finished !== null}
            onResolve={finalize}
          />
        )}
        {challenge.kind === 'stroop' && (
          <StroopBoard
            challenge={challenge}
            finished={finished !== null}
            onResolve={finalize}
          />
        )}
        {challenge.kind === 'order-tap' && (
          <OrderTapBoard
            challenge={challenge}
            finished={finished !== null}
            onResolve={finalize}
          />
        )}
        {challenge.kind === 'word-scramble' && (
          <WordScrambleBoard
            challenge={challenge}
            finished={finished !== null}
            onResolve={finalize}
          />
        )}
        {challenge.kind === 'symmetry-draw' && (
          <SymmetryDrawBoard
            challenge={challenge}
            finished={finished !== null}
            onResolve={finalize}
          />
        )}
        {challenge.kind === 'pipe-connect' && (
          <PipeConnectBoard
            challenge={challenge}
            finished={finished !== null}
            onResolve={finalize}
          />
        )}
        {challenge.kind === 'logic-arrange' && (
          <LogicArrangeBoard
            challenge={challenge}
            finished={finished !== null}
            onResolve={finalize}
          />
        )}
      </div>

      {/* Round Result & Country Impact Banner */}
      {finished && (
        <div
          className={`mt-6 rounded-xl border p-4 sm:p-5 animate-pop-in ${
            finished.won
              ? 'border-emerald-500/40 bg-emerald-500/10'
              : 'border-rose-500/40 bg-rose-500/10 animate-shake'
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              {finished.won ? (
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
              ) : (
                <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-rose-400" />
              )}
              <div>
                <div className="font-display text-lg font-bold text-white">
                  {finished.won ? 'Bravo ! Défi réussi' : finished.reason}
                </div>
                <p className="mt-1 text-sm text-slate-200">{challenge.explanation}</p>

                {!duelMode && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-3 text-sm font-semibold">
                    {finished.won ? (
                      <span className="text-emerald-300">
                        {myCountry.flag} {myCountry.name} gagne{' '}
                        <span className="font-mono-num">
                          +{lastServerDelta?.countryDelta ?? challenge.basePoints} pts
                        </span>
                      </span>
                    ) : (
                      <span className="text-rose-300">
                        {myCountry.flag} {myCountry.name} perd{' '}
                        <span className="font-mono-num">
                          {lastServerDelta?.countryDelta ?? -15} pts
                        </span>
                      </span>
                    )}

                    {rivalCountry && lastServerDelta && lastServerDelta.rivalDelta !== 0 && (
                      <>
                        <span className="text-slate-500" aria-hidden="true">
                          ·
                        </span>
                        <span
                          className={
                            lastServerDelta.rivalDelta < 0
                              ? 'text-amber-300'
                              : 'text-rose-300'
                          }
                        >
                          {rivalCountry.flag} {rivalCountry.name}{' '}
                          <span className="font-mono-num">
                            {lastServerDelta.rivalDelta > 0
                              ? `+${lastServerDelta.rivalDelta}`
                              : lastServerDelta.rivalDelta}{' '}
                            pts
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {!duelMode && onShareChallenge && (
                <button
                  type="button"
                  onClick={handleTriggerShare}
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-[#162032] px-4 py-3 text-sm font-semibold text-white hover:border-amber-400/60 transition-colors whitespace-nowrap shrink-0"
                >
                  <Share2 className="h-4 w-4 text-amber-400" />
                  Défier un ami
                </button>
              )}
              {onNext && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={onNext}
                  className="flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-300 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  Question suivante
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================================================
// SUB-BOARDS FOR EACH INTERACTIVE CHALLENGE MECHANIC
// ==================================================

function McqBoard({
  challenge,
  finished,
  onResolve,
}: {
  challenge: Extract<Challenge, { kind: 'mcq' }>;
  finished: boolean;
  onResolve: (won: boolean, reason: string) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [challenge.id]);

  const chooseOption = useCallback(
    (idx: number) => {
      if (finished || idx < 0 || idx >= challenge.options.length) return;
      soundFX.playTap();
      setSelected(idx);
      if (idx === challenge.correctIndex) {
        onResolve(true, 'Bonne réponse !');
      } else {
        onResolve(
          false,
          `Mauvaise réponse (c'était « ${challenge.options[challenge.correctIndex]} »).`
        );
      }
    },
    [challenge.correctIndex, challenge.options, finished, onResolve]
  );

  useEffect(() => {
    if (finished) return;
    const onKey = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      const key = e.key.toUpperCase();
      const map: Record<string, number> = {
        '1': 0, A: 0,
        '2': 1, B: 1,
        '3': 2, C: 2,
        '4': 3, D: 3,
      };
      if (key in map) {
        e.preventDefault();
        chooseOption(map[key]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chooseOption, finished]);

  return (
    <div className="space-y-5">
      {challenge.visual && (
        <div className="rounded-xl border border-white/10 bg-[#0B1120] p-4 sm:p-5 flex items-center justify-center">
          {challenge.visual.type === 'sequence' && (
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {challenge.visual.items.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex h-12 min-w-[3.25rem] items-center justify-center rounded-lg border px-3 font-mono-num text-lg font-bold ${
                    item === '?'
                      ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                      : 'border-white/10 bg-[#162032] text-white'
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
          )}

          {challenge.visual.type === 'flag' && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-7xl sm:text-8xl leading-none select-none">
                {challenge.visual.flag}
              </span>
            </div>
          )}

          {challenge.visual.type === 'cipher' && (
            <div className="text-center">
              <div className="font-mono-num text-2xl sm:text-3xl font-bold tracking-[0.22em] text-amber-300">
                {challenge.visual.encoded}
              </div>
              <div className="mt-1.5 text-xs text-slate-400">{challenge.visual.ruleHint}</div>
            </div>
          )}

          {challenge.visual.type === 'equation' && (
            <div className="space-y-1.5 font-mono-num text-base sm:text-lg text-slate-100">
              {challenge.visual.rows.map((r, i) => (
                <div key={i} className={i === 3 ? 'text-amber-300 font-bold pt-1' : ''}>
                  {r}
                </div>
              ))}
            </div>
          )}

          {challenge.visual.type === 'icons' && (
            <div className="flex items-center gap-4 text-5xl sm:text-6xl select-none">
              {challenge.visual.tokens.map((tok, i) => (
                <span key={i}>{tok}</span>
              ))}
            </div>
          )}

          {challenge.visual.type === 'matrix' && (
            <div className="grid grid-cols-3 gap-2.5">
              {challenge.visual.cells.map((cell, idx) => (
                <div
                  key={idx}
                  className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-lg border ${
                    cell === null
                      ? 'border-amber-400/70 bg-amber-400/10 text-2xl font-bold text-amber-300'
                      : 'border-white/10 bg-[#162032]'
                  }`}
                >
                  {cell === null ? (
                    '?'
                  ) : (
                    <div className="flex flex-wrap items-center justify-center gap-1 p-1.5">
                      {Array.from({ length: cell.count }).map((_, k) => (
                        <div key={k} className="h-6 w-6">
                          <ShapeSvg shape={cell.shape} color={cell.color} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {challenge.options.map((opt, idx) => {
          const isCorrect = idx === challenge.correctIndex;
          const isChosen = selected === idx;
          let btnClass =
            'border-white/15 bg-[#162032] text-slate-100 hover:border-amber-400/60 hover:bg-[#1C2A42]';
          if (finished) {
            if (isCorrect) {
              btnClass = 'border-emerald-400 bg-emerald-500/20 text-white';
            } else if (isChosen) {
              btnClass = 'border-rose-400 bg-rose-500/20 text-rose-100';
            } else {
              btnClass = 'border-white/5 bg-[#0B1120] text-slate-500';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={finished}
              onClick={() => chooseOption(idx)}
              className={`flex min-h-[54px] items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm sm:text-base font-medium transition-colors ${btnClass}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 font-mono-num text-xs font-bold text-slate-300">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="leading-snug">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MemoryGridBoard({
  challenge,
  finished,
  onResolve,
}: {
  challenge: MemoryGridChallenge;
  finished: boolean;
  onResolve: (won: boolean, reason: string) => void;
}) {
  const [phase, setPhase] = useState<'preview' | 'recall'>('preview');
  const [found, setFound] = useState<number[]>([]);
  const [wrongCell, setWrongCell] = useState<number | null>(null);

  useEffect(() => {
    setPhase('preview');
    setFound([]);
    setWrongCell(null);
    const t = window.setTimeout(() => {
      setPhase('recall');
      soundFX.playTick();
    }, challenge.previewMs);
    return () => window.clearTimeout(t);
  }, [challenge.id, challenge.previewMs]);

  const total = challenge.gridSize * challenge.gridSize;
  const targetSet = useMemo(() => new Set(challenge.targets), [challenge.targets]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm font-semibold text-slate-300">
        {phase === 'preview'
          ? 'Mémorisez les cases allumées...'
          : `Retrouvez les ${challenge.targets.length} cases (${found.length}/${challenge.targets.length})`}
      </div>

      <div
        className="grid gap-2.5"
        style={{
          gridTemplateColumns: `repeat(${challenge.gridSize}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: total }).map((_, idx) => {
          const isTarget = targetSet.has(idx);
          const isFound = found.includes(idx);
          const isWrong = wrongCell === idx;
          const lit = (phase === 'preview' && isTarget) || isFound || (finished && isTarget);

          return (
            <button
              key={idx}
              type="button"
              disabled={phase === 'preview' || finished || isFound}
              onClick={() => {
                if (isTarget) {
                  soundFX.playTap();
                  const next = [...found, idx];
                  setFound(next);
                  if (next.length === challenge.targets.length) {
                    onResolve(true, 'Mémoire parfaite !');
                  }
                } else {
                  setWrongCell(idx);
                  onResolve(false, 'Case erronée cliquée !');
                }
              }}
              className={`h-14 w-14 sm:h-16 sm:w-16 rounded-xl border transition-all duration-150 ${
                isWrong
                  ? 'border-rose-400 bg-rose-500/40'
                  : lit
                  ? 'border-amber-300 bg-amber-400 shadow-lg shadow-amber-500/20'
                  : 'border-white/15 bg-[#162032] hover:border-white/30'
              }`}
              aria-label={`Case ${idx + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function SpotDiffBoard({
  challenge,
  finished,
  onResolve,
}: {
  challenge: SpotDiffChallenge;
  finished: boolean;
  onResolve: (won: boolean, reason: string) => void;
}) {
  const [clickedWrong, setClickedWrong] = useState<number | null>(null);
  useEffect(() => setClickedWrong(null), [challenge.id]);

  const total = challenge.gridSize * challenge.gridSize;

  return (
    <div className="flex justify-center">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${challenge.gridSize}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: total }).map((_, idx) => {
          const isOdd = idx === challenge.oddIndex;
          const shape = isOdd ? challenge.oddShape : challenge.baseShape;
          const color = isOdd ? challenge.oddColor : challenge.baseColor;
          const rotation = isOdd ? challenge.oddRotation : challenge.baseRotation;
          const label = isOdd ? challenge.oddLabel : challenge.baseLabel;

          return (
            <button
              key={idx}
              type="button"
              disabled={finished}
              onClick={() => {
                soundFX.playTap();
                if (isOdd) {
                  onResolve(true, 'Intrus repéré !');
                } else {
                  setClickedWrong(idx);
                  onResolve(false, "Ce n'était pas l'intrus !");
                }
              }}
              className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg border transition-colors ${
                finished && isOdd
                  ? 'border-emerald-400 bg-emerald-500/25'
                  : clickedWrong === idx
                  ? 'border-rose-400 bg-rose-500/25'
                  : 'border-white/10 bg-[#162032] hover:border-amber-400/60'
              }`}
              aria-label={`Symbole ${idx + 1}`}
            >
              <ShapeSvg shape={shape} color={color} rotation={rotation} label={label} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SimonSeqBoard({
  challenge,
  finished,
  onResolve,
}: {
  challenge: SimonSeqChallenge;
  finished: boolean;
  onResolve: (won: boolean, reason: string) => void;
}) {
  const [playingDemo, setPlayingDemo] = useState(true);
  const [litPad, setLitPad] = useState<number | null>(null);
  const [userSeq, setUserSeq] = useState<number[]>([]);

  const expected = useMemo(
    () => (challenge.reverse ? [...challenge.sequence].reverse() : challenge.sequence),
    [challenge.reverse, challenge.sequence]
  );

  useEffect(() => {
    setPlayingDemo(true);
    setLitPad(null);
    setUserSeq([]);

    const timers: number[] = [];
    challenge.sequence.forEach((pad, step) => {
      const startDelay = 450 + step * 520;
      timers.push(
        window.setTimeout(() => {
          setLitPad(pad);
          soundFX.playTick();
        }, startDelay)
      );
      timers.push(
        window.setTimeout(() => {
          setLitPad(null);
        }, startDelay + 340)
      );
    });

    const endDelay = 450 + challenge.sequence.length * 520 + 100;
    timers.push(
      window.setTimeout(() => {
        setPlayingDemo(false);
      }, endDelay)
    );

    return () => timers.forEach(window.clearTimeout);
  }, [challenge.id, challenge.sequence]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm font-semibold text-slate-300">
        {playingDemo
          ? 'Observez la séquence lumineuse...'
          : `Votre tour (${userSeq.length}/${expected.length})`}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        {challenge.padColors.map((color, idx) => {
          const isLit = litPad === idx;
          return (
            <button
              key={idx}
              type="button"
              disabled={playingDemo || finished}
              onClick={() => {
                soundFX.playTap();
                const next = [...userSeq, idx];
                const stepIdx = next.length - 1;
                if (idx !== expected[stepIdx]) {
                  setUserSeq(next);
                  onResolve(false, 'Erreur dans la séquence !');
                  return;
                }
                setUserSeq(next);
                setLitPad(idx);
                window.setTimeout(() => setLitPad((cur) => (cur === idx ? null : cur)), 160);
                if (next.length === expected.length) {
                  onResolve(true, 'Séquence parfaite !');
                }
              }}
              className="flex h-20 items-center justify-center rounded-xl border font-display text-2xl font-extrabold text-white transition-transform active:scale-95"
              style={{
                backgroundColor: isLit ? color : '#162032',
                borderColor: isLit ? '#FFFFFF' : color,
                boxShadow: isLit ? `0 0 24px ${color}` : undefined,
              }}
            >
              {challenge.padLabels[idx]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StroopBoard({
  challenge,
  finished,
  onResolve,
}: {
  challenge: StroopChallenge;
  finished: boolean;
  onResolve: (won: boolean, reason: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center rounded-xl border border-white/10 bg-[#0B1120] py-8">
        <span
          className="font-display text-5xl sm:text-6xl font-extrabold tracking-wider select-none"
          style={{ color: challenge.inkHex }}
        >
          {challenge.wordText}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {challenge.options.map((opt, idx) => (
          <button
            key={opt.label}
            type="button"
            disabled={finished}
            onClick={() => {
              soundFX.playTap();
              if (idx === challenge.correctIndex) {
                onResolve(true, 'Réflexe visuel impeccable !');
              } else {
                onResolve(false, `Piège ! La bonne réponse était ${challenge.options[challenge.correctIndex].label}.`);
              }
            }}
            className="flex min-h-[54px] items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-[#162032] px-4 py-3 font-display text-base font-bold text-white hover:border-amber-400/60 hover:bg-[#1C2A42] transition-colors"
          >
            <span
              className="h-3.5 w-3.5 rounded-full shrink-0"
              style={{ backgroundColor: opt.hex }}
              aria-hidden="true"
            />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function OrderTapBoard({
  challenge,
  finished,
  onResolve,
}: {
  challenge: OrderTapChallenge;
  finished: boolean;
  onResolve: (won: boolean, reason: string) => void;
}) {
  const [tappedIds, setTappedIds] = useState<number[]>([]);
  useEffect(() => setTappedIds([]), [challenge.id]);

  const sortedValues = useMemo(
    () =>
      [...challenge.tiles]
        .map((t) => t.value)
        .sort((a, b) => (challenge.descending ? b - a : a - b)),
    [challenge.descending, challenge.tiles]
  );

  return (
    <div className="space-y-4">
      <div className="text-center text-xs font-medium text-slate-400">
        Progression : {tappedIds.length} / {challenge.tiles.length}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {challenge.tiles.map((tile) => {
          const isTapped = tappedIds.includes(tile.id);
          return (
            <button
              key={tile.id}
              type="button"
              disabled={finished || isTapped}
              onClick={() => {
                soundFX.playTap();
                const expectedVal = sortedValues[tappedIds.length];
                if (tile.value !== expectedVal) {
                  onResolve(false, `Mauvais ordre ! Il fallait la valeur ${expectedVal}.`);
                  return;
                }
                const next = [...tappedIds, tile.id];
                setTappedIds(next);
                if (next.length === challenge.tiles.length) {
                  onResolve(true, 'Tri éclair validé !');
                }
              }}
              className={`flex h-16 items-center justify-center rounded-xl border font-mono-num text-xl font-bold transition-all ${
                isTapped
                  ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 opacity-60'
                  : 'border-white/15 bg-[#162032] text-white hover:border-amber-400 hover:bg-[#1C2A42]'
              }`}
            >
              {tile.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WordScrambleBoard({
  challenge,
  finished,
  onResolve,
}: {
  challenge: WordScrambleChallenge;
  finished: boolean;
  onResolve: (won: boolean, reason: string) => void;
}) {
  const [pickedIndices, setPickedIndices] = useState<number[]>([]);
  useEffect(() => setPickedIndices([]), [challenge.id]);

  const currentWord = pickedIndices.map((i) => challenge.scrambledLetters[i]).join('');

  const handlePick = (idx: number) => {
    if (finished || pickedIndices.includes(idx)) return;
    soundFX.playTap();
    const next = [...pickedIndices, idx];
    setPickedIndices(next);
    if (next.length === challenge.targetWord.length) {
      const formed = next.map((i) => challenge.scrambledLetters[i]).join('');
      if (formed === challenge.targetWord) {
        onResolve(true, 'Mot forgé avec brio !');
      } else {
        onResolve(false, `Mot incorrect (« ${formed} » au lieu de « ${challenge.targetWord} »).`);
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-white/10 bg-[#0B1120] px-4 py-3 text-center text-sm text-amber-200">
        Définition : <span className="font-semibold text-white">{challenge.clue}</span>
      </div>

      {/* Answer slots (click any filled letter to remove it) */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: challenge.targetWord.length }).map((_, slotIdx) => {
          const letter = currentWord[slotIdx] ?? '';
          return (
            <button
              key={slotIdx}
              type="button"
              disabled={finished || !letter}
              onClick={() => {
                if (!letter || finished) return;
                soundFX.playTap();
                setPickedIndices((prev) => prev.filter((_, i) => i !== slotIdx));
              }}
              title={letter ? 'Retirer cette lettre' : undefined}
              className={`flex h-12 w-11 items-center justify-center rounded-lg border font-mono-num text-xl font-bold transition-colors ${
                letter
                  ? 'border-amber-400 bg-amber-400/15 text-white hover:bg-rose-500/20 hover:border-rose-400'
                  : 'border-white/15 bg-[#0B1120] text-slate-600 cursor-default'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Letter rack */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {challenge.scrambledLetters.map((char, idx) => {
          const used = pickedIndices.includes(idx);
          return (
            <button
              key={idx}
              type="button"
              disabled={finished || used}
              onClick={() => handlePick(idx)}
              className={`flex h-12 w-12 items-center justify-center rounded-xl border font-mono-num text-lg font-bold transition-all ${
                used
                  ? 'border-white/5 bg-[#0B1120] text-slate-600 opacity-35'
                  : 'border-white/20 bg-[#162032] text-white hover:border-amber-400 hover:bg-[#1E2C45]'
              }`}
            >
              {char}
            </button>
          );
        })}
      </div>

      {!finished && pickedIndices.length > 0 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setPickedIndices([])}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Effacer
          </button>
        </div>
      )}
    </div>
  );
}

function SymmetryDrawBoard({
  challenge,
  finished,
  onResolve,
}: {
  challenge: SymmetryDrawChallenge;
  finished: boolean;
  onResolve: (won: boolean, reason: string) => void;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  useEffect(() => setSelected([]), [challenge.id]);

  const givenSet = useMemo(() => new Set(challenge.givenCells), [challenge.givenCells]);
  const targetSet = useMemo(
    () => new Set(challenge.targetMissingCells),
    [challenge.targetMissingCells]
  );

  const half = Math.floor(challenge.gridSize / 2);
  const total = challenge.gridSize * challenge.gridSize;

  const isLockedCell = (idx: number) => {
    const r = Math.floor(idx / challenge.gridSize);
    const c = idx % challenge.gridSize;
    if (challenge.axis === 'vertical') {
      return c < half || (challenge.gridSize % 2 === 1 && c === half);
    }
    return r < half || (challenge.gridSize % 2 === 1 && r === half);
  };

  const handleValidate = () => {
    if (finished) return;
    const ok =
      selected.length === targetSet.size && selected.every((cell) => targetSet.has(cell));
    if (ok) {
      onResolve(true, 'Symétrie parfaite !');
    } else {
      onResolve(false, 'La symétrie ne correspond pas exactement au modèle.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${challenge.gridSize}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: total }).map((_, idx) => {
            const locked = isLockedCell(idx);
            const isGiven = givenSet.has(idx);
            const isPicked = selected.includes(idx);
            const isTarget = targetSet.has(idx);

            let cellStyle = 'border-white/15 bg-[#162032] hover:border-amber-400/60';
            if (locked) {
              cellStyle = isGiven
                ? 'border-sky-400 bg-sky-500'
                : 'border-white/5 bg-[#0B1120] opacity-70 cursor-default';
            } else if (finished) {
              if (isTarget) cellStyle = 'border-emerald-400 bg-emerald-500';
              else if (isPicked) cellStyle = 'border-rose-400 bg-rose-500';
            } else if (isPicked) {
              cellStyle = 'border-amber-300 bg-amber-400';
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={locked || finished}
                onClick={() => {
                  soundFX.playTap();
                  setSelected((prev) =>
                    prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]
                  );
                }}
                className={`h-11 w-11 sm:h-12 sm:w-12 rounded-lg border transition-colors ${cellStyle}`}
                aria-label={`Cellule ${idx + 1}`}
              />
            );
          })}
        </div>
      </div>

      {!finished && (
        <button
          type="button"
          onClick={handleValidate}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
        >
          Valider la symétrie ({selected.length} blocs)
        </button>
      )}
    </div>
  );
}

function PipeConnectBoard({
  challenge,
  finished,
  onResolve,
}: {
  challenge: PipeConnectChallenge;
  finished: boolean;
  onResolve: (won: boolean, reason: string) => void;
}) {
  const [rotations, setRotations] = useState<number[]>(() =>
    challenge.tiles.map((t) => t.initialRot)
  );

  useEffect(() => {
    setRotations(challenge.tiles.map((t) => t.initialRot));
  }, [challenge.id, challenge.tiles]);

  const startRow = Math.floor(challenge.startIndex / 4);
  const endRow = Math.floor(challenge.endIndex / 4);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        {/* West input arrow */}
        <div className="grid grid-rows-4 gap-2 h-[244px] sm:h-[280px]">
          {[0, 1, 2, 3].map((r) => (
            <div key={r} className="flex items-center justify-end w-8">
              {r === startRow && (
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-300">
                  IN →
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {challenge.tiles.map((tile, idx) => {
            const rot = rotations[idx] ?? 0;
            const mask = rotatePipeMask(getPipeBaseMask(tile.type), rot);
            const isStart = idx === challenge.startIndex;
            const isEnd = idx === challenge.endIndex;

            return (
              <button
                key={idx}
                type="button"
                disabled={finished}
                onClick={() => {
                  soundFX.playTap();
                  const next = [...rotations];
                  next[idx] = (next[idx] + 1) % 4;
                  setRotations(next);
                  if (
                    isPipeCircuitSolved(
                      challenge.tiles,
                      next,
                      challenge.startIndex,
                      challenge.endIndex
                    )
                  ) {
                    onResolve(true, 'Circuit connecté !');
                  }
                }}
                className={`relative h-14 w-14 sm:h-16 sm:w-16 rounded-lg border transition-colors ${
                  isStart
                    ? 'border-emerald-400/60 bg-[#162032]'
                    : isEnd
                    ? 'border-amber-400/60 bg-[#162032]'
                    : 'border-white/15 bg-[#162032] hover:border-blue-400'
                }`}
                aria-label={`Tuile circuit ${idx + 1}`}
              >
                <svg viewBox="0 0 40 40" className="w-full h-full">
                  <circle cx="20" cy="20" r="4.2" fill="#38BDF8" />
                  {(mask & 1) !== 0 && (
                    <rect x="17" y="0" width="6" height="20" fill="#38BDF8" rx="1" />
                  )}
                  {(mask & 2) !== 0 && (
                    <rect x="20" y="17" width="20" height="6" fill="#38BDF8" rx="1" />
                  )}
                  {(mask & 4) !== 0 && (
                    <rect x="17" y="20" width="6" height="20" fill="#38BDF8" rx="1" />
                  )}
                  {(mask & 8) !== 0 && (
                    <rect x="0" y="17" width="20" height="6" fill="#38BDF8" rx="1" />
                  )}
                </svg>
              </button>
            );
          })}
        </div>

        {/* East output arrow */}
        <div className="grid grid-rows-4 gap-2 h-[244px] sm:h-[280px]">
          {[0, 1, 2, 3].map((r) => (
            <div key={r} className="flex items-center justify-start w-10">
              {r === endRow && (
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[11px] font-bold text-amber-300">
                  → OUT
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {!finished && (
        <p className="text-xs text-slate-400">
          Cliquez sur chaque tuile pour la faire pivoter de 90° jusqu’à fermer le circuit.
        </p>
      )}
    </div>
  );
}

function LogicArrangeBoard({
  challenge,
  finished,
  onResolve,
}: {
  challenge: LogicArrangeChallenge;
  finished: boolean;
  onResolve: (won: boolean, reason: string) => void;
}) {
  const [placed, setPlaced] = useState<string[]>([]);
  useEffect(() => setPlaced([]), [challenge.id]);

  const itemMap = useMemo(
    () => new Map(challenge.items.map((item) => [item.id, item])),
    [challenge.items]
  );

  return (
    <div className="space-y-5">
      <div className="space-y-1.5 rounded-xl border border-white/10 bg-[#0B1120] p-4 text-sm text-slate-200">
        {challenge.clues.map((clue, idx) => (
          <div key={idx}>• {clue}</div>
        ))}
      </div>

      {/* Slots 1..4 (click a filled slot to remove it) */}
      <div className="grid grid-cols-4 gap-2.5">
        {[0, 1, 2, 3].map((slotIdx) => {
          const itemId = placed[slotIdx];
          const item = itemId ? itemMap.get(itemId) : null;
          return (
            <button
              key={slotIdx}
              type="button"
              disabled={finished || !item}
              onClick={() => {
                if (!item || finished) return;
                soundFX.playTap();
                setPlaced((prev) => prev.filter((_, i) => i !== slotIdx));
              }}
              className={`flex h-16 flex-col items-center justify-center rounded-xl border px-2 text-center transition-colors ${
                item
                  ? 'border-white/25 bg-[#162032] hover:border-rose-400'
                  : 'border-dashed border-white/20 bg-[#0B1120] cursor-default'
              }`}
            >
              <span className="text-[11px] text-slate-500">Place {slotIdx + 1}</span>
              {item && (
                <span
                  className="mt-0.5 text-sm font-bold"
                  style={{ color: item.color }}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Token buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {challenge.items.map((item) => {
          const used = placed.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              disabled={finished || used}
              onClick={() => {
                soundFX.playTap();
                const next = [...placed, item.id];
                setPlaced(next);
                if (next.length === challenge.solutionIds.length) {
                  const ok = next.every((id, i) => id === challenge.solutionIds[i]);
                  if (ok) {
                    onResolve(true, 'Logique implacable !');
                  } else {
                    onResolve(false, "Cet ordre ne respecte pas tous les indices.");
                  }
                }
              }}
              className={`min-h-[44px] rounded-xl border px-4 py-2 text-sm font-bold transition-all ${
                used
                  ? 'border-white/5 bg-[#0B1120] opacity-35'
                  : 'border-white/15 bg-[#162032] hover:border-amber-400'
              }`}
              style={{ color: item.color }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {!finished && placed.length > 0 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setPlaced([])}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser
          </button>
        </div>
      )}
    </div>
  );
}

import { Play, Search, Share2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  CHALLENGE_CATEGORIES,
  TOTAL_CHALLENGES,
  getChallengeById,
} from '../data/challengesGenerator';
import { ChallengeCategory } from '../types/game';

interface CatalogViewProps {
  solvedIds: number[];
  onPlaySpecificChallenge: (id: number) => void;
  onPlayCategory: (category: ChallengeCategory) => void;
  onShareChallengeId: (id: number) => void;
}

export function CatalogView({
  solvedIds,
  onPlaySpecificChallenge,
  onPlayCategory,
  onShareChallengeId,
}: CatalogViewProps) {
  const [selectedCat, setSelectedCat] = useState<ChallengeCategory>('enigma');
  const [jumpId, setJumpId] = useState('');
  const [pageOffset, setPageOffset] = useState(0);

  const solvedSet = useMemo(() => new Set(solvedIds), [solvedIds]);
  const currentInfo =
    CHALLENGE_CATEGORIES.find((c) => c.id === selectedCat) ?? CHALLENGE_CATEGORIES[0];

  const previewChallenges = useMemo(() => {
    const list = [];
    const base = currentInfo.rangeStart + pageOffset * 12;
    for (let i = 0; i < 12; i++) {
      const id = base + i;
      if (id <= currentInfo.rangeEnd) {
        list.push(getChallengeById(id));
      }
    }
    return list;
  }, [currentInfo, pageOffset]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            Encyclopédie des {TOTAL_CHALLENGES.toLocaleString('fr-FR')} Défis
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Chaque défi possède un numéro unique de #00001 à #{TOTAL_CHALLENGES}. Déjà résolus par
            vous : <span className="font-mono-num font-bold text-emerald-400">{solvedIds.length}</span>
          </p>
        </div>

        {/* Jump to exact challenge ID */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const num = Number(jumpId);
            if (num >= 1 && num <= TOTAL_CHALLENGES) {
              onPlaySpecificChallenge(num);
            }
          }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              min={1}
              max={TOTAL_CHALLENGES}
              value={jumpId}
              onChange={(e) => setJumpId(e.target.value)}
              placeholder="N° du défi (1 à 12500)"
              className="w-52 rounded-lg border border-white/15 bg-[#121B2E] py-2 pl-9 pr-3 font-mono-num text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300 whitespace-nowrap shrink-0 transition-colors"
          >
            Jouer ce n°
          </button>
        </form>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHALLENGE_CATEGORIES.map((cat) => {
          const active = selectedCat === cat.id;
          return (
            <div
              key={cat.id}
              className={`flex flex-col justify-between rounded-xl border p-5 transition-colors ${
                active
                  ? 'border-amber-400 bg-[#162238]'
                  : 'border-white/10 bg-[#121B2E] hover:border-white/25'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCat(cat.id);
                      setPageOffset(0);
                    }}
                    className="font-display text-lg font-bold text-white text-left hover:text-amber-300"
                  >
                    {cat.label}
                  </button>
                  <span className="font-mono-num text-xs font-bold text-amber-400">
                    {cat.count.toLocaleString('fr-FR')} défis
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-400">{cat.description}</p>
                <div className="mt-2 font-mono-num text-xs text-slate-500">
                  Index #{String(cat.rangeStart).padStart(5, '0')} – #
                  {String(cat.rangeEnd).padStart(5, '0')}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPlayCategory(cat.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 whitespace-nowrap shrink-0 transition-colors"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Jouer aléatoire
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCat(cat.id);
                    setPageOffset(0);
                  }}
                  className="rounded-lg border border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 whitespace-nowrap shrink-0 transition-colors"
                >
                  Explorer
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Grid for Selected Category */}
      <div className="rounded-xl border border-white/10 bg-[#121B2E] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <h2 className="font-display text-lg font-bold text-white">
            Aperçu · {currentInfo.label}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pageOffset === 0}
              onClick={() => setPageOffset((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-40"
            >
              Précédent
            </button>
            <button
              type="button"
              onClick={() => setPageOffset((p) => p + 12)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5"
            >
              +144 défis plus loin
            </button>
            <button
              type="button"
              disabled={currentInfo.rangeStart + (pageOffset + 1) * 12 > currentInfo.rangeEnd}
              onClick={() => setPageOffset((p) => p + 1)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {previewChallenges.map((ch) => {
            const isSolved = solvedSet.has(ch.id);
            return (
              <div
                key={ch.id}
                className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#162032] p-4 hover:border-amber-400/60 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onPlaySpecificChallenge(ch.id)}
                  className="text-left w-full"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono-num font-bold text-amber-400">
                      #{String(ch.id).padStart(5, '0')}
                    </span>
                    <span className={isSolved ? 'text-emerald-400 font-semibold' : 'capitalize'}>
                      {isSolved ? 'Résolu' : ch.difficulty}
                    </span>
                  </div>
                  <div className="mt-1.5 font-display text-base font-bold text-white">
                    {ch.title}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{ch.prompt}</p>
                </button>
                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
                  <button
                    type="button"
                    onClick={() => onPlaySpecificChallenge(ch.id)}
                    className="text-xs font-semibold text-amber-400 hover:underline"
                  >
                    Jouer ce défi
                  </button>
                  <button
                    type="button"
                    onClick={() => onShareChallengeId(ch.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white"
                  >
                    <Share2 className="h-3.5 w-3.5 text-amber-400" />
                    Partager
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

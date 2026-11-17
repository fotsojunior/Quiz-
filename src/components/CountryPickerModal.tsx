import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { COUNTRIES } from '../data/countries';
import { Continent, CountryStanding } from '../types/game';

interface CountryPickerModalProps {
  isOpen: boolean;
  mode: 'player' | 'rival';
  selectedCode: string;
  playerName: string;
  standingsMap: Map<string, CountryStanding>;
  rankMap: Map<string, number>;
  onSelectCountry: (code: string) => void;
  onChangePlayerName: (name: string) => void;
  onClose: () => void;
}

const CONTINENTS: Array<Continent | 'Tous'> = [
  'Tous',
  'Europe',
  'Afrique',
  'Asie',
  'Amériques',
  'Océanie',
];

export function CountryPickerModal({
  isOpen,
  mode,
  selectedCode,
  playerName,
  standingsMap,
  rankMap,
  onSelectCountry,
  onChangePlayerName,
  onClose,
}: CountryPickerModalProps) {
  const [search, setSearch] = useState('');
  const [continent, setContinent] = useState<Continent | 'Tous'>('Tous');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return COUNTRIES.filter((c) => {
      if (continent !== 'Tous' && c.continent !== continent) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.capital.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
      );
    }).sort((a, b) => {
      const rankA = rankMap.get(a.code) ?? 999;
      const rankB = rankMap.get(b.code) ?? 999;
      return rankA - rankB;
    });
  }, [search, continent, rankMap]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-xl border border-white/10 bg-[#121B2E] shadow-2xl animate-pop-in">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-white">
              {mode === 'player'
                ? 'Choisissez votre pays et votre pseudo'
                : 'Choisissez le pays rival à défier'}
            </h2>
            <p className="mt-0.5 text-sm text-slate-400">
              {mode === 'player'
                ? 'Chaque bonne réponse rapporte des points à votre pays. Chaque erreur lui en fait perdre.'
                : 'En duel direct, vos victoires retirent des points au pays rival.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 border-b border-white/10 px-6 py-4">
          {mode === 'player' && (
            <div>
              <label
                htmlFor="player-pseudo"
                className="block text-xs font-medium text-slate-400 mb-1.5"
              >
                Votre pseudo de champion
              </label>
              <input
                id="player-pseudo"
                type="text"
                maxLength={24}
                value={playerName}
                onChange={(e) => onChangePlayerName(e.target.value)}
                placeholder="Ex : Alex, Sarah, Lion237..."
                className="w-full rounded-lg border border-white/15 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un pays ou une capitale (195 pays)..."
                className="w-full rounded-lg border border-white/15 bg-[#0B1120] py-2.5 pl-9 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {CONTINENTS.map((cont) => (
                <button
                  key={cont}
                  type="button"
                  onClick={() => setContinent(cont)}
                  className={`rounded-md px-3 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    continent === cont
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-[#0B1120] text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {cont}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-2 overflow-y-auto p-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCountries.map((country) => {
            const standing = standingsMap.get(country.code);
            const rank = rankMap.get(country.code) ?? 1;
            const isSelected = country.code === selectedCode;
            return (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onSelectCountry(country.code);
                  onClose();
                }}
                className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors min-h-[56px] ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400/10'
                    : 'border-white/10 bg-[#162032] hover:border-white/25 hover:bg-[#1B2840]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl leading-none shrink-0" aria-hidden="true">
                    {country.flag}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">
                      {country.name}
                    </div>
                    <div className="truncate text-xs text-slate-400">
                      #{rank} · {country.continent}
                    </div>
                  </div>
                </div>
                <span className="font-mono-num text-xs font-bold text-amber-400 shrink-0">
                  {(standing?.points ?? 1000).toLocaleString('fr-FR')}
                </span>
              </button>
            );
          })}
          {filteredCountries.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-slate-400">
              Aucun pays ne correspond à votre recherche.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

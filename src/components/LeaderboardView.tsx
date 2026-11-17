import { Search, Swords } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getCountry } from '../data/countries';
import { Continent, Country, CountryStanding } from '../types/game';

interface LeaderboardViewProps {
  standings: CountryStanding[];
  myCountry: Country;
  rivalCountry: Country | null;
  onDefyCountry: (code: string) => void;
}

const CONTINENTS: Array<Continent | 'Tous'> = [
  'Tous',
  'Europe',
  'Afrique',
  'Asie',
  'Amériques',
  'Océanie',
];

export function LeaderboardView({
  standings,
  myCountry,
  rivalCountry,
  onDefyCountry,
}: LeaderboardViewProps) {
  const [search, setSearch] = useState('');
  const [continent, setContinent] = useState<Continent | 'Tous'>('Tous');
  const [sortBy, setSortBy] = useState<'points' | 'wins' | 'streak'>('points');

  const rankedList = useMemo(() => {
    const baseSorted = [...standings].sort((a, b) => b.points - a.points || b.wins - a.wins);
    const rankLookup = new Map(baseSorted.map((s, idx) => [s.code, idx + 1]));
    const q = search.trim().toLowerCase();

    return standings
      .map((s) => ({
        standing: s,
        country: getCountry(s.code),
        globalRank: rankLookup.get(s.code) ?? 195,
      }))
      .filter(({ country }) => {
        if (continent !== 'Tous' && country.continent !== continent) return false;
        if (!q) return true;
        return (
          country.name.toLowerCase().includes(q) ||
          country.capital.toLowerCase().includes(q) ||
          country.code.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'wins') {
          return b.standing.wins - a.standing.wins || b.standing.points - a.standing.points;
        }
        if (sortBy === 'streak') {
          return (
            b.standing.bestStreak - a.standing.bestStreak ||
            b.standing.points - a.standing.points
          );
        }
        return b.standing.points - a.standing.points || b.standing.wins - a.standing.wins;
      });
  }, [standings, search, continent, sortBy]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            Classement Mondial des 195 Pays
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Mis à jour en temps réel à chaque défi gagné ou perdu dans le monde entier.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#121B2E] p-1">
          {(
            [
              { id: 'points', label: 'Points' },
              { id: 'wins', label: 'Victoires' },
              { id: 'streak', label: 'Meilleure série' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSortBy(opt.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                sortBy === opt.id
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer par pays ou capitale..."
            className="w-full rounded-lg border border-white/15 bg-[#121B2E] py-2.5 pl-9 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {CONTINENTS.map((cont) => (
            <button
              key={cont}
              type="button"
              onClick={() => setContinent(cont)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                continent === cont
                  ? 'bg-white text-slate-950'
                  : 'border border-white/10 bg-[#121B2E] text-slate-300 hover:text-white'
              }`}
            >
              {cont}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="mt-5 overflow-x-auto rounded-xl border border-white/10 bg-[#121B2E]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-slate-400">
              <th className="py-3.5 pl-5 pr-3">Rang</th>
              <th className="py-3.5 px-3">Pays</th>
              <th className="py-3.5 px-3 hidden sm:table-cell">Continent</th>
              <th className="py-3.5 px-3 text-right">Points</th>
              <th className="py-3.5 px-3 text-right hidden md:table-cell">Victoires</th>
              <th className="py-3.5 px-3 text-right hidden md:table-cell">Défaites</th>
              <th className="py-3.5 px-3 text-right hidden lg:table-cell">Série max</th>
              <th className="py-3.5 pl-3 pr-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {rankedList.map(({ standing, country, globalRank }) => {
              const isMe = country.code === myCountry.code;
              const isRival = rivalCountry?.code === country.code;

              return (
                <tr
                  key={country.code}
                  className={`transition-colors ${
                    isMe
                      ? 'bg-amber-400/10'
                      : isRival
                      ? 'bg-rose-500/10'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <td className="py-3 pl-5 pr-3 font-mono-num font-bold text-slate-300">
                    #{globalRank}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl leading-none shrink-0" aria-hidden="true">
                        {country.flag}
                      </span>
                      <div>
                        <div className="font-semibold text-white">
                          {country.name}
                          {isMe && (
                            <span className="ml-2 text-xs font-semibold text-amber-400">
                              (Votre pays)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{country.capital}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-300 hidden sm:table-cell">
                    {country.continent}
                  </td>
                  <td className="py-3 px-3 text-right font-mono-num font-bold text-amber-400">
                    {standing.points.toLocaleString('fr-FR')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono-num text-emerald-400 hidden md:table-cell">
                    {standing.wins}
                  </td>
                  <td className="py-3 px-3 text-right font-mono-num text-rose-400 hidden md:table-cell">
                    {standing.losses}
                  </td>
                  <td className="py-3 px-3 text-right font-mono-num text-slate-300 hidden lg:table-cell">
                    {standing.bestStreak}
                  </td>
                  <td className="py-3 pl-3 pr-5 text-right">
                    {!isMe ? (
                      <button
                        type="button"
                        onClick={() => onDefyCountry(country.code)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#162032] px-3 py-1.5 text-xs font-semibold text-white hover:border-amber-400 hover:text-amber-300 whitespace-nowrap shrink-0 transition-colors"
                      >
                        <Swords className="h-3.5 w-3.5" />
                        Défier
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

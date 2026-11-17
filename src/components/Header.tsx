import { CloudCheck, LogIn } from 'lucide-react';
import { Country, CountryStanding } from '../types/game';

export type AppTab = 'arena' | 'leaderboard' | 'duel' | 'catalog' | 'parcours';

interface HeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  myCountry: Country;
  myStanding?: CountryStanding;
  onOpenCountryPicker: () => void;
  isAuthenticated: boolean;
  authUserLabel?: string | null;
  isSigningIn: boolean;
  onSignInGoogle: () => void;
  onOpenParcours: () => void;
}

export function Header({
  activeTab,
  onSelectTab,
  myCountry,
  myStanding,
  onOpenCountryPicker,
  isAuthenticated,
  authUserLabel,
  isSigningIn,
  onSignInGoogle,
  onOpenParcours,
}: HeaderProps) {
  const navItems: Array<{ id: AppTab; label: string }> = [
    { id: 'arena', label: 'Jouer' },
    { id: 'leaderboard', label: 'Classement' },
    { id: 'duel', label: 'Duel Live' },
    { id: 'catalog', label: 'Défis' },
    { id: 'parcours', label: 'Parcours' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0B1120]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 sm:gap-8 px-4 py-3 sm:px-6">
        {/* Zone 1: Brand mark with ? logo */}
        <button
          type="button"
          onClick={() => onSelectTab('arena')}
          className="flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 font-display text-xl font-black text-slate-950"
            aria-hidden="true"
          >
            ?
          </span>
          <span>quiz</span>
        </button>

        {/* Zone 2: Concise single-line text nav links */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded ${
                  active
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-[13px] h-0.5 bg-amber-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary country action + Google Firestore account action */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={onOpenParcours}
              title="Compte Google synchronisé avec Firestore"
              aria-label="Compte connecté"
              className="flex items-center gap-1.5 rounded-lg border border-emerald-400/35 bg-emerald-400/10 px-2.5 sm:px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20 whitespace-nowrap shrink-0 transition-colors"
            >
              <CloudCheck className="h-4 w-4 text-emerald-400" />
              <span className="hidden sm:inline max-w-[96px] truncate">
                {authUserLabel || 'Synchronisé'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignInGoogle}
              disabled={isSigningIn}
              title="Connexion avec Google"
              aria-label="Connexion avec Google"
              className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#162032] px-2.5 sm:px-3 py-2 text-xs font-semibold text-slate-200 hover:border-amber-400/60 hover:text-white disabled:opacity-50 whitespace-nowrap shrink-0 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">
                {isSigningIn ? 'Connexion…' : 'Connexion'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCountryPicker}
            className="flex items-center gap-2.5 rounded-lg border border-white/15 bg-[#162032] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:border-amber-400/60 hover:bg-[#1E2B42] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <span className="text-lg leading-none" aria-hidden="true">
              {myCountry.flag}
            </span>
            <span className="max-w-[110px] truncate">{myCountry.name}</span>
            <span className="text-slate-500" aria-hidden="true">
              ·
            </span>
            <span className="font-mono-num text-amber-400">
              {(myStanding?.points ?? 1000).toLocaleString('fr-FR')} pts
            </span>
          </button>
        </div>
      </div>

      {/* Compact mobile nav bar */}
      <nav className="flex md:hidden border-t border-white/5 px-2 overflow-x-auto">
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex-1 py-2.5 px-2 text-xs font-semibold text-center whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

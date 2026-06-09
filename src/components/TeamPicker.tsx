'use client';

import { getTeamInitials } from '@/lib/match-utils';
import type { FavoriteTeam } from '@/lib/favorite-teams';

function TeamAvatar({ team }: { team: FavoriteTeam }) {
  if (team.logo) {
    return <img src={team.logo} alt="" className="size-8 rounded-full bg-white/90 object-contain p-1" loading="lazy" />;
  }

  return <span className="grid size-8 place-items-center rounded-full bg-white/10 text-[0.65rem] font-black text-white ring-1 ring-white/10">{getTeamInitials(team.name)}</span>;
}

type TeamPickerProps = {
  teams: FavoriteTeam[];
  favorites: string[];
  onToggle: (teamCode: string) => void;
  isLoading?: boolean;
};

export function TeamPicker({ teams, favorites, onToggle, isLoading = false }: TeamPickerProps) {
  const favoriteSet = new Set(favorites);

  if (isLoading) {
    return <div className="cw-card mt-4 h-40 animate-pulse" />;
  }

  if (!teams.length) {
    return <p className="mt-4 cw-card border-dashed px-4 py-5 text-sm font-bold text-slate-300">Teams will appear once the schedule loads.</p>;
  }

  return (
    <div className="mt-4 grid max-h-80 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 [scrollbar-color:rgba(148,163,184,0.5)_transparent]">
      {teams.map((team) => {
        const selected = favoriteSet.has(team.abbreviation);

        return (
          <button
            key={team.abbreviation}
            type="button"
            onClick={() => onToggle(team.abbreviation)}
            aria-pressed={selected}
            className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
              selected
                ? 'border-[var(--cw-primary)] bg-[linear-gradient(135deg,var(--cw-primary),var(--cw-cyan))] text-slate-950 shadow-[var(--cw-glow-green)]'
                : 'border-white/10 bg-white/[0.07] text-slate-100 hover:border-white/20 hover:bg-white/[0.12]'
            }`}
          >
            <TeamAvatar team={team} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black">{team.name}</span>
              <span className={`text-xs font-black uppercase tracking-wide ${selected ? 'text-slate-700' : 'text-slate-300'}`}>{team.abbreviation}</span>
            </span>
            <span className={`rounded-full px-2 py-1 text-[0.65rem] font-black uppercase tracking-wide ${selected ? 'bg-slate-950 text-emerald-200' : 'bg-slate-950/35 text-slate-300'}`}>{selected ? 'Following' : 'Follow'}</span>
          </button>
        );
      })}
    </div>
  );
}

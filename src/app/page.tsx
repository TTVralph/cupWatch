import { MotionCard } from '@/components/MotionCard';
import { PageShell } from '@/components/PageShell';
import { getCupWatchDataService } from '@/services/data-service';
import type { Match, MatchStatus } from '@/types/cupwatch';

const statusLabels: Record<MatchStatus, string> = {
  live: 'Live now',
  upcoming: 'Upcoming',
  finished: 'Finished',
};

const statusStyles: Record<MatchStatus, string> = {
  live: 'bg-red-50 text-red-700 ring-red-100',
  upcoming: 'bg-blue-50 text-blue-700 ring-blue-100',
  finished: 'bg-slate-100 text-slate-700 ring-slate-200',
};

function formatKickoff(match: Match) {
  if (match.status === 'live') return match.minute ?? 'Live';
  if (match.status === 'finished') return 'FT';

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(match.kickoff));
}

function scoreOrTime(match: Match) {
  if (match.status === 'upcoming') return formatKickoff(match);
  return `${match.home.score ?? 0} - ${match.away.score ?? 0}`;
}

function MatchCard({ match, index }: { match: Match; index: number }) {
  return (
    <MotionCard delay={index * 0.04} className="rounded-[1.5rem] border border-white/80 bg-white p-4 shadow-sm shadow-slate-200/80 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ${statusStyles[match.status]}`}>{statusLabels[match.status]}</span>
        <span className="text-xs font-bold text-slate-500">{match.stage}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div>
          <p className="text-2xl" aria-hidden="true">{match.home.flag}</p>
          <h2 className="mt-1 text-base font-black text-slate-950">{match.home.name}</h2>
          <p className="text-xs font-bold text-slate-400">{match.home.code}</p>
        </div>
        <div className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-lg font-black text-white shadow-lg shadow-slate-950/10">{scoreOrTime(match)}</div>
        <div className="text-right">
          <p className="text-2xl" aria-hidden="true">{match.away.flag}</p>
          <h2 className="mt-1 text-base font-black text-slate-950">{match.away.name}</h2>
          <p className="text-xs font-bold text-slate-400">{match.away.code}</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">{match.venue}</div>
    </MotionCard>
  );
}

export default async function TodayPage() {
  const matches = await getCupWatchDataService().getTodayMatches();

  return (
    <PageShell eyebrow="Today" title="What games are on today?" description="Live, upcoming, and finished matches in one calm view — no login, no betting, no cluttered feeds.">
      <div className="grid gap-4 md:grid-cols-2">
        {matches.map((match, index) => <MatchCard key={match.id} match={match} index={index} />)}
      </div>
    </PageShell>
  );
}

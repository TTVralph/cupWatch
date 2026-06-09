import { MotionCard } from '@/components/MotionCard';
import { PageShell } from '@/components/PageShell';
import { getCupWatchDataService } from '@/services/data-service';

export default async function BracketPage() {
  const rounds = await getCupWatchDataService().getBracket();

  return (
    <PageShell eyebrow="Bracket" title="Knockout path, ready for real results" description="Placeholder slots keep the format understandable until group winners and runners-up are confirmed.">
      <div className="flex gap-4 overflow-x-auto pb-3 snap-x">
        {rounds.map((round, index) => (
          <section key={round.round} className="min-w-[280px] flex-1 snap-start">
            <h2 className="mb-3 px-1 text-sm font-black uppercase tracking-[0.2em] text-slate-500">{round.round}</h2>
            <div className="space-y-3">
              {round.matches.map((match, matchIndex) => (
                <MotionCard key={match.id} delay={(index + matchIndex) * 0.04} className="rounded-[1.5rem] border border-white/80 bg-white p-4 shadow-sm shadow-slate-200/80">
                  <div className="space-y-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-800">{match.slotA}</div>
                    <div className="px-2 text-xs font-black uppercase tracking-wide text-emerald-600">vs</div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-800">{match.slotB}</div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                    <span>{match.date}</span>
                    <span className="text-right">{match.venue}</span>
                  </div>
                </MotionCard>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}

import { MotionCard } from '@/components/MotionCard';
import { PageShell } from '@/components/PageShell';
import { getCupWatchDataService } from '@/services/data-service';

export default async function StandingsPage() {
  const groups = await getCupWatchDataService().getStandings();

  return (
    <PageShell eyebrow="Standings" title="Group tables without the noise" description="Mock standings are ready now and can be replaced by live data through the CupWatch service layer later.">
      <div className="grid gap-5 lg:grid-cols-2">
        {groups.map((group, index) => (
          <MotionCard key={group.group} delay={index * 0.05} className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-sm shadow-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <h2 className="text-lg font-black text-slate-950">{group.group}</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Top teams advance</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-2 py-3 text-center">P</th>
                    <th className="px-2 py-3 text-center">W</th>
                    <th className="px-2 py-3 text-center">D</th>
                    <th className="px-2 py-3 text-center">L</th>
                    <th className="px-2 py-3 text-center">GD</th>
                    <th className="px-4 py-3 text-center">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.rows.map((row) => (
                    <tr key={row.code} className="text-slate-700">
                      <td className="px-4 py-3 font-bold text-slate-950"><span className="mr-2">{row.flag}</span>{row.team}</td>
                      <td className="px-2 py-3 text-center">{row.played}</td>
                      <td className="px-2 py-3 text-center">{row.wins}</td>
                      <td className="px-2 py-3 text-center">{row.draws}</td>
                      <td className="px-2 py-3 text-center">{row.losses}</td>
                      <td className="px-2 py-3 text-center">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                      <td className="px-4 py-3 text-center font-black text-slate-950">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </MotionCard>
        ))}
      </div>
    </PageShell>
  );
}

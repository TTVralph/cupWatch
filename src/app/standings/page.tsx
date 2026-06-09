'use client';

import { useEffect, useState } from 'react';
import { MotionCard } from '@/components/MotionCard';
import { PageShell } from '@/components/PageShell';
import type { GroupStanding } from '@/types/cupwatch';

type StandingsApiResponse = {
  data: GroupStanding[];
  source: 'espn' | 'mock';
  fallback: boolean;
  message?: string;
};

function formatGoalDifference(goalDifference: number) {
  return goalDifference > 0 ? `+${goalDifference}` : goalDifference;
}

function LoadingTable() {
  return <div className="h-72 animate-pulse rounded-[1.5rem] bg-white/80 shadow-sm shadow-slate-200/80" />;
}

function StandingsTable({ group, index }: { group: GroupStanding; index: number }) {
  return (
    <MotionCard delay={index * 0.05} className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-sm shadow-slate-200/80">
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
                <td className="px-4 py-3 font-bold text-slate-950">
                  <span className="mr-2">{row.flag}</span>
                  {row.team}
                </td>
                <td className="px-2 py-3 text-center">{row.played}</td>
                <td className="px-2 py-3 text-center">{row.wins}</td>
                <td className="px-2 py-3 text-center">{row.draws}</td>
                <td className="px-2 py-3 text-center">{row.losses}</td>
                <td className="px-2 py-3 text-center">{formatGoalDifference(row.goalDifference)}</td>
                <td className="px-4 py-3 text-center font-black text-slate-950">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MotionCard>
  );
}

export default function StandingsPage() {
  const [groups, setGroups] = useState<GroupStanding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStandings() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/standings');
        if (!response.ok) {
          throw new Error(`Standings request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as StandingsApiResponse;
        if (!isMounted) return;

        setGroups(payload.data);
        setFallbackMessage(payload.fallback ? payload.message ?? 'Showing fallback group tables while live data is unavailable.' : null);
      } catch (fetchError) {
        if (!isMounted) return;
        console.error('Unable to load standings:', fetchError);
        setGroups([]);
        setError('Unable to load standings right now. Please refresh in a moment.');
        setFallbackMessage(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadStandings();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <PageShell eyebrow="Standings" title="Group tables without the noise" description="Live ESPN group tables are served through CupWatch’s API layer, with calm fallback standings if the feed is unavailable.">
      {fallbackMessage ? <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{fallbackMessage}</div> : null}
      {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      {isLoading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <LoadingTable />
          <LoadingTable />
        </div>
      ) : groups.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {groups.map((group, index) => (
            <StandingsTable key={group.group} group={group} index={index} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-sm font-bold text-slate-500">No standings are available right now.</div>
      )}
    </PageShell>
  );
}

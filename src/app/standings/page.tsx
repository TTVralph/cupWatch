'use client';

import { useEffect, useMemo, useState } from 'react';
import { CupCard } from '@/components/Brand';
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
  return <div className="h-72 animate-pulse cw-card" />;
}

function groupLetter(groupName: string) {
  return groupName.replace(/^Group\s+/i, '').trim();
}

function StandingsTable({ group, index }: { group: GroupStanding; index: number }) {
  return (
    <CupCard delay={index * 0.05} className="overflow-hidden text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-3 sm:px-4 sm:py-4">
        <h2 className="text-base font-black text-white sm:text-lg">{group.group}</h2>
        <span className="rounded-full bg-[rgba(245,197,91,0.1)] px-3 py-1 text-[0.7rem] font-black text-[var(--cw-primary)] sm:text-xs">Top teams advance</span>
      </div>
      <div className="overflow-x-auto">
        <table className="cw-table w-full table-fixed text-left text-xs sm:text-sm">
          <thead className="bg-white/[0.06] text-[0.68rem] uppercase tracking-wide text-slate-300 sm:text-xs">
            <tr>
              <th className="w-[38%] px-3 py-3 sm:px-4">Team</th>
              <th className="w-[9%] px-1 py-3 text-center">P</th>
              <th className="w-[9%] px-1 py-3 text-center">W</th>
              <th className="w-[9%] px-1 py-3 text-center">D</th>
              <th className="w-[9%] px-1 py-3 text-center">L</th>
              <th className="w-[11%] px-1 py-3 text-center">GD</th>
              <th className="w-[15%] px-2 py-3 text-center sm:px-4">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {group.rows.map((row) => (
              <tr key={row.code} className="text-slate-200">
                <td className="px-3 py-3 font-bold text-white sm:px-4">
                  <span className="mr-1.5">{row.flag}</span>
                  <span className="align-middle leading-tight">{row.team}</span>
                </td>
                <td className="px-1 py-3 text-center">{row.played}</td>
                <td className="px-1 py-3 text-center">{row.wins}</td>
                <td className="px-1 py-3 text-center">{row.draws}</td>
                <td className="px-1 py-3 text-center">{row.losses}</td>
                <td className="px-1 py-3 text-center">{formatGoalDifference(row.goalDifference)}</td>
                <td className="px-2 py-3 text-center font-black text-white sm:px-4">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CupCard>
  );
}

export default function StandingsPage() {
  const [groups, setGroups] = useState<GroupStanding[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showAllGroups, setShowAllGroups] = useState(false);
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
        setSelectedGroup((currentGroup) => currentGroup ?? payload.data[0]?.group ?? null);
        setFallbackMessage(payload.fallback ? payload.message ?? 'Showing saved group tables while live standings are unavailable.' : null);
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

  const selectedGroupData = useMemo(() => groups.find((group) => group.group === selectedGroup) ?? groups[0] ?? null, [groups, selectedGroup]);

  return (
    <PageShell eyebrow="Standings" title="Group tables without the noise" description="Live group tables are served through CupWatch’s API layer, with calm saved standings if the feed is unavailable.">
      {fallbackMessage ? <div className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100">{fallbackMessage}</div> : null}
      {error ? <div className="mb-4 rounded-2xl border border-red-300/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100">{error}</div> : null}

      {isLoading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <LoadingTable />
          <LoadingTable />
        </div>
      ) : groups.length ? (
        <>
          <div className="mb-5 md:hidden">
            <div className="overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max gap-2">
                {groups.map((group) => {
                  const active = !showAllGroups && selectedGroupData?.group === group.group;

                  return (
                    <button
                      key={group.group}
                      type="button"
                      onClick={() => {
                        setSelectedGroup(group.group);
                        setShowAllGroups(false);
                      }}
                      className={`cw-pill px-4 py-2 text-sm ${
                        active ? 'cw-pill-active' : ''
                      }`}
                    >
                      {groupLetter(group.group)}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowAllGroups((value) => !value)}
                  className={`cw-pill px-4 py-2 text-sm ${
                    showAllGroups ? 'cw-pill-active' : ''
                  }`}
                >
                  {showAllGroups ? 'One group' : 'Show all'}
                </button>
              </div>
            </div>
            <p className="mt-2 px-1 text-xs font-bold text-slate-300">Swipe Group A–L chips, or show every table when you want the full view.</p>
          </div>

          <div className="md:hidden">
            {showAllGroups ? (
              <div className="grid gap-5">
                {groups.map((group, index) => <StandingsTable key={group.group} group={group} index={index} />)}
              </div>
            ) : selectedGroupData ? (
              <StandingsTable key={selectedGroupData.group} group={selectedGroupData} index={0} />
            ) : null}
          </div>

          <div className="hidden gap-5 md:grid lg:grid-cols-2">
            {groups.map((group, index) => (
              <StandingsTable key={group.group} group={group} index={index} />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.06] px-4 py-6 text-sm font-bold text-slate-300">No standings are available right now.</div>
      )}
    </PageShell>
  );
}

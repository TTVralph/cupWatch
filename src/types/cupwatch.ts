export type MatchStatus = 'live' | 'upcoming' | 'finished';

export type TeamSide = {
  name: string;
  code: string;
  flag: string;
  score?: number;
};

export type Match = {
  id: string;
  status: MatchStatus;
  kickoff: string;
  home: TeamSide;
  away: TeamSide;
  venue: string;
  stage: string;
  minute?: string;
};

export type StandingRow = {
  team: string;
  code: string;
  flag: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  points: number;
};

export type GroupStanding = {
  group: string;
  rows: StandingRow[];
};

export type BracketRound = {
  round: string;
  matches: Array<{
    id: string;
    slotA: string;
    slotB: string;
    venue: string;
    date: string;
  }>;
};

export type NewsItem = {
  id: string;
  headline: string;
  source: string;
  time: string;
  summary: string;
};

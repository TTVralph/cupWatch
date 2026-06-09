export type { Match, MatchStatus } from './match';

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

export type NewsArticle = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  source?: string;
  publishedAt?: string;
  url?: string;
};

export type NewsItem = NewsArticle;

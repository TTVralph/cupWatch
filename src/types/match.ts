export type MatchStatus = 'pre' | 'live' | 'post';

export type Match = {
  id: string;
  date: string;
  status: MatchStatus;
  statusText: string;
  homeTeam: {
    name: string;
    abbreviation: string;
    logo?: string;
    score?: string;
  };
  awayTeam: {
    name: string;
    abbreviation: string;
    logo?: string;
    score?: string;
  };
  venue?: string;
  city?: string;
  country?: string;
  round?: string;
  broadcasts?: string[];
};

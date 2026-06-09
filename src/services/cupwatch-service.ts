import type { BracketRound, GroupStanding, Match, NewsArticle } from '@/types/cupwatch';

export interface CupWatchDataService {
  getTodayMatches(): Promise<Match[]>;
  getStandings(): Promise<GroupStanding[]>;
  getBracket(): Promise<BracketRound[]>;
  getNews(): Promise<NewsArticle[]>;
}

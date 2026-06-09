import type { BracketRound, GroupStanding, Match, NewsArticle } from '@/types/cupwatch';

export const mockTodayMatches: Match[] = [
  {
    id: '760415',
    status: 'pre',
    date: '2026-06-11T19:00:00Z',
    statusText: 'Scheduled',
    homeTeam: { name: 'Mexico', abbreviation: 'MEX' },
    awayTeam: { name: 'South Africa', abbreviation: 'RSA' },
    venue: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    round: 'Group A',
    broadcasts: ['FOX'],
  },
  {
    id: 'mex-kor',
    status: 'live',
    date: '2026-06-09T20:00:00Z',
    statusText: "63'",
    homeTeam: { name: 'Mexico', abbreviation: 'MEX', score: '1' },
    awayTeam: { name: 'South Korea', abbreviation: 'KOR', score: '1' },
    venue: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    round: 'Group A',
    broadcasts: ['FOX'],
  },
  {
    id: 'usa-ghana',
    status: 'pre',
    date: '2026-06-09T23:00:00Z',
    statusText: '8:00 PM EDT',
    homeTeam: { name: 'United States', abbreviation: 'USA' },
    awayTeam: { name: 'Ghana', abbreviation: 'GHA' },
    venue: 'SoFi Stadium',
    city: 'Los Angeles',
    country: 'United States',
    round: 'Group B',
    broadcasts: ['FOX'],
  },
  {
    id: 'can-jpn',
    status: 'post',
    date: '2026-06-09T17:00:00Z',
    statusText: 'Final',
    homeTeam: { name: 'Canada', abbreviation: 'CAN', score: '2' },
    awayTeam: { name: 'Japan', abbreviation: 'JPN', score: '0' },
    venue: 'BMO Field',
    city: 'Toronto',
    country: 'Canada',
    round: 'Group C',
  },
  {
    id: 'bra-den',
    status: 'pre',
    date: '2026-06-10T01:00:00Z',
    statusText: '9:00 PM EDT',
    homeTeam: { name: 'Brazil', abbreviation: 'BRA' },
    awayTeam: { name: 'Denmark', abbreviation: 'DEN' },
    venue: 'AT&T Stadium',
    city: 'Dallas',
    country: 'United States',
    round: 'Group D',
    broadcasts: ['FS1'],
  },
];

export const mockStandings: GroupStanding[] = [
  {
    group: 'Group A',
    rows: [
      { team: 'Mexico', code: 'MEX', flag: '🇲🇽', played: 1, wins: 0, draws: 1, losses: 0, goalDifference: 0, points: 1 },
      { team: 'South Korea', code: 'KOR', flag: '🇰🇷', played: 1, wins: 0, draws: 1, losses: 0, goalDifference: 0, points: 1 },
      { team: 'Norway', code: 'NOR', flag: '🇳🇴', played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0 },
      { team: 'Egypt', code: 'EGY', flag: '🇪🇬', played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0 },
    ],
  },
  {
    group: 'Group B',
    rows: [
      { team: 'United States', code: 'USA', flag: '🇺🇸', played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0 },
      { team: 'Ghana', code: 'GHA', flag: '🇬🇭', played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0 },
      { team: 'Croatia', code: 'CRO', flag: '🇭🇷', played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0 },
      { team: 'Australia', code: 'AUS', flag: '🇦🇺', played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0 },
    ],
  },
  {
    group: 'Group C',
    rows: [
      { team: 'Canada', code: 'CAN', flag: '🇨🇦', played: 1, wins: 1, draws: 0, losses: 0, goalDifference: 2, points: 3 },
      { team: 'Spain', code: 'ESP', flag: '🇪🇸', played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0 },
      { team: 'Morocco', code: 'MAR', flag: '🇲🇦', played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0 },
      { team: 'Japan', code: 'JPN', flag: '🇯🇵', played: 1, wins: 0, draws: 0, losses: 1, goalDifference: -2, points: 0 },
    ],
  },
];

export const mockBracket: BracketRound[] = [
  {
    round: 'Round of 32',
    matches: [
      { id: 'r32-1', slotA: 'Winner Group A', slotB: 'Runner-up Group B', venue: 'MetLife Stadium', date: 'June 28' },
      { id: 'r32-2', slotA: 'Winner Group C', slotB: 'Runner-up Group D', venue: 'NRG Stadium', date: 'June 29' },
      { id: 'r32-3', slotA: 'Winner Group E', slotB: 'Runner-up Group F', venue: 'BC Place', date: 'June 29' },
      { id: 'r32-4', slotA: 'Winner Group G', slotB: 'Runner-up Group H', venue: 'Arrowhead Stadium', date: 'June 30' },
    ],
  },
  {
    round: 'Round of 16',
    matches: [
      { id: 'r16-1', slotA: 'Winner Match 1', slotB: 'Winner Match 2', venue: 'Levi\'s Stadium', date: 'July 4' },
      { id: 'r16-2', slotA: 'Winner Match 3', slotB: 'Winner Match 4', venue: 'Gillette Stadium', date: 'July 5' },
    ],
  },
  {
    round: 'Quarter-finals',
    matches: [
      { id: 'qf-1', slotA: 'Round of 16 Winner', slotB: 'Round of 16 Winner', venue: 'SoFi Stadium', date: 'July 9' },
      { id: 'qf-2', slotA: 'Round of 16 Winner', slotB: 'Round of 16 Winner', venue: 'AT&T Stadium', date: 'July 10' },
    ],
  },
  {
    round: 'Semi-finals',
    matches: [
      { id: 'sf-1', slotA: 'Quarter-final Winner', slotB: 'Quarter-final Winner', venue: 'Mercedes-Benz Stadium', date: 'July 14' },
      { id: 'sf-2', slotA: 'Quarter-final Winner', slotB: 'Quarter-final Winner', venue: 'MetLife Stadium', date: 'July 15' },
    ],
  },
  {
    round: 'Final',
    matches: [{ id: 'final', slotA: 'Semi-final Winner', slotB: 'Semi-final Winner', venue: 'MetLife Stadium', date: 'July 19' }],
  },
];

export const mockNews: NewsArticle[] = [
  {
    id: 'squad-notes',
    title: 'Hosts keep focus as opening week rhythm builds',
    source: 'CupWatch Desk',
    publishedAt: '2026-06-09T12:00:00Z',
    description: 'Training updates, travel notes, and likely rotation plans from the three host nations in one quick read.',
  },
  {
    id: 'venue-guide',
    title: 'How to follow matchday across three time zones',
    source: 'Matchday Guide',
    publishedAt: '2026-06-09T11:30:00Z',
    description: 'A simple viewing map for North American kickoff windows, built for fans checking scores between commutes.',
  },
  {
    id: 'group-watch',
    title: 'Group C storylines to watch before first kickoffs',
    source: 'CupWatch Analysis',
    publishedAt: '2026-06-09T11:00:00Z',
    description: 'Canada, Spain, Morocco, and Japan bring contrasting styles into one of the tournament’s most balanced groups.',
  },
];

import type { BracketRound, GroupStanding, Match, NewsItem } from '@/types/cupwatch';

export const mockTodayMatches: Match[] = [
  {
    id: 'mex-kor',
    status: 'live',
    kickoff: '2026-06-09T20:00:00Z',
    home: { name: 'Mexico', code: 'MEX', flag: '🇲🇽', score: 1 },
    away: { name: 'South Korea', code: 'KOR', flag: '🇰🇷', score: 1 },
    venue: 'Estadio Azteca, Mexico City',
    stage: 'Group A',
    minute: '63\'',
  },
  {
    id: 'usa-ghana',
    status: 'upcoming',
    kickoff: '2026-06-09T23:00:00Z',
    home: { name: 'United States', code: 'USA', flag: '🇺🇸' },
    away: { name: 'Ghana', code: 'GHA', flag: '🇬🇭' },
    venue: 'SoFi Stadium, Los Angeles',
    stage: 'Group B',
  },
  {
    id: 'can-jpn',
    status: 'finished',
    kickoff: '2026-06-09T17:00:00Z',
    home: { name: 'Canada', code: 'CAN', flag: '🇨🇦', score: 2 },
    away: { name: 'Japan', code: 'JPN', flag: '🇯🇵', score: 0 },
    venue: 'BMO Field, Toronto',
    stage: 'Group C',
  },
  {
    id: 'bra-den',
    status: 'upcoming',
    kickoff: '2026-06-10T01:00:00Z',
    home: { name: 'Brazil', code: 'BRA', flag: '🇧🇷' },
    away: { name: 'Denmark', code: 'DEN', flag: '🇩🇰' },
    venue: 'AT&T Stadium, Dallas',
    stage: 'Group D',
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

export const mockNews: NewsItem[] = [
  {
    id: 'squad-notes',
    headline: 'Hosts keep focus as opening week rhythm builds',
    source: 'CupWatch Desk',
    time: '12 min ago',
    summary: 'Training updates, travel notes, and likely rotation plans from the three host nations in one quick read.',
  },
  {
    id: 'venue-guide',
    headline: 'How to follow matchday across three time zones',
    source: 'Matchday Guide',
    time: '38 min ago',
    summary: 'A simple viewing map for North American kickoff windows, built for fans checking scores between commutes.',
  },
  {
    id: 'group-watch',
    headline: 'Group C starts to take shape after Canada win',
    source: 'CupWatch Analysis',
    time: '1 hr ago',
    summary: 'Canada’s goal difference gives them an early cushion while Spain and Morocco prepare for their first match.',
  },
];

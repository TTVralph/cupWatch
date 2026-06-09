import type { CupWatchDataService } from './cupwatch-service';
import { mockBracket, mockNews, mockStandings, mockTodayMatches } from './mock-data';

export class MockCupWatchService implements CupWatchDataService {
  async getTodayMatches() {
    return mockTodayMatches;
  }

  async getStandings() {
    return mockStandings;
  }

  async getBracket() {
    return mockBracket;
  }

  async getNews() {
    return mockNews;
  }
}

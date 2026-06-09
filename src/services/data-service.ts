import type { CupWatchDataService } from './cupwatch-service';
import { MockCupWatchService } from './mock-service';

// Swap this factory to an ESPN-backed implementation later. UI components and
// pages should keep depending on this service boundary instead of direct fetches.
export function getCupWatchDataService(): CupWatchDataService {
  return new MockCupWatchService();
}

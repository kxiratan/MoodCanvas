import { Session } from '../types/session';
import { MoodState } from '../types/mood';

const INACTIVE_SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const CLEANUP_INTERVAL = 60 * 60 * 1000; // Run cleanup every hour

export interface SessionCleanupStats {
  inactiveSessions: number;
  removedMoods: number;
  timestamp: number;
}

export class SessionCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private lastCleanupStats: SessionCleanupStats | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  public startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
    }, CLEANUP_INTERVAL);
  }

  public stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  public getLastCleanupStats(): SessionCleanupStats | null {
    return this.lastCleanupStats;
  }

  public cleanupInactiveSessions(): void {
    const currentTime = Date.now();
    let inactiveSessionCount = 0;
    let removedMoodsCount = 0;

    // Clean up session moods
    for (const sessionId in global.sessionMoods) {
      const moods = global.sessionMoods[sessionId];
      const lastActivity = Math.max(...moods.map(mood => mood.timestamp));

      if (currentTime - lastActivity > INACTIVE_SESSION_TIMEOUT) {
        // Session is inactive, remove it
        removedMoodsCount += moods.length;
        delete global.sessionMoods[sessionId];
        inactiveSessionCount++;
      } else {
        // Clean up old moods from active sessions
        const oldMoodsCount = moods.length;
        global.sessionMoods[sessionId] = moods.filter(
          (mood: MoodState) => currentTime - mood.timestamp <= INACTIVE_SESSION_TIMEOUT
        );
        removedMoodsCount += oldMoodsCount - global.sessionMoods[sessionId].length;
      }
    }

    this.lastCleanupStats = {
      inactiveSessions: inactiveSessionCount,
      removedMoods: removedMoodsCount,
      timestamp: currentTime
    };
  }
}
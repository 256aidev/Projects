/**
 * Ad-Gated Access Manager
 * Tracks session-based unlocks for ad-gated content
 * Users watch interstitial ads to unlock premium features
 */

export type ContentType = 'weekly' | 'monthly' | 'yearly' | 'personalDailyIntelligence';

class AdGatedAccessManager {
  private sessionUnlocks: Set<ContentType> = new Set();
  private unlockedFutureDates: Set<string> = new Set();

  /**
   * Check if a content type is unlocked for this session
   */
  isUnlocked(contentType: ContentType): boolean {
    return this.sessionUnlocks.has(contentType);
  }

  /**
   * Check if a specific future date is unlocked
   * Each date must be individually unlocked by watching an ad
   */
  isFutureDateUnlocked(dateStr: string): boolean {
    return this.unlockedFutureDates.has(dateStr);
  }

  /**
   * Mark a content type as unlocked after watching an ad
   */
  unlockContent(contentType: ContentType): void {
    this.sessionUnlocks.add(contentType);
    console.log(`[AdGatedAccessManager] Unlocked ${contentType} for session`);
  }

  /**
   * Unlock a specific future date after watching an ad
   * Each ad unlocks only that specific date for the session
   */
  unlockFutureDate(dateStr: string): void {
    this.unlockedFutureDates.add(dateStr);
    console.log(`[AdGatedAccessManager] Future date ${dateStr} unlocked for session`);
  }

  /**
   * Get all unlocked future dates
   */
  getUnlockedFutureDates(): string[] {
    return Array.from(this.unlockedFutureDates);
  }

  /**
   * Reset all session unlocks (call on app close/logout)
   */
  resetSession(): void {
    this.sessionUnlocks.clear();
    this.unlockedFutureDates.clear();
    console.log('[AdGatedAccessManager] Session reset');
  }
}

// Singleton instance
export const adGatedAccessManager = new AdGatedAccessManager();
export default adGatedAccessManager;

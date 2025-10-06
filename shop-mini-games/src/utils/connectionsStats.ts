import { useAsyncStorage } from "@shopify/shop-minis-react";

// Local-only interfaces for type definitions
export interface UserStats {
  user_id: string;
  total_games_played: number;
  best_time?: number;
  average_time?: number;
  average_lives_remaining?: number;
  total_score: number;
  current_streak: number;
  longest_streak: number;
  last_played: string;
}

export interface GameStats {
  total_players: number;
  average_completion_time: number;
  average_lives_remaining: number;
  completion_rate: number;
}

export interface LeaderboardResponse {
  leaderboard: Array<{
    user_id: string;
    score: number;
    completion_time: number;
    lives_remaining: number;
  }>;
}

export interface PersonalStats {
  average_completion_time: number;
  average_lives_remaining: number;
  total_games_played: number;
  completion_rate: number;
}

export interface LifetimeStats {
  gamesPlayed: number;
  gamesWon: number;
  totalTime: number; // seconds
  totalMistakes: number;
  totalGuesses: number;
  winDates: string[]; // Array of dates (YYYY-MM-DD) when user won
  currentStreak: number;
  longestStreak: number;
  fastestTime: number | null; // fastest completion time in seconds
}

export interface ProgressData {
  user_id: string;
  completion_time: number;
  score: number;
  completed: boolean;
  lives_remaining: number;
  game_type: string;
}


/**
 * Default stats object
 */
const defaultStats: LifetimeStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  totalTime: 0,
  totalMistakes: 0,
  totalGuesses: 0,
  winDates: [],
  currentStreak: 0,
  longestStreak: 0,
  fastestTime: null,
};

/**
 * Hook for managing lifetime stats with Shopify AsyncStorage
 */
export function useLifetimeStats() {
  const { getItem, setItem } = useAsyncStorage();
  
  const loadStats = async (): Promise<LifetimeStats> => {
    console.log("📖 ConnectionsResults: Loading stats from AsyncStorage");
    try {
      const stored = await getItem({ key: "connections-stats" });
      
      if (stored) {
        const parsedStats = JSON.parse(stored);
        console.log("✅ ConnectionsResults: Stats found:", parsedStats);
        
        // Ensure backward compatibility - add new fields if they don't exist
        if (!parsedStats.winDates) parsedStats.winDates = [];
        if (parsedStats.currentStreak === undefined) parsedStats.currentStreak = 0;
        if (parsedStats.longestStreak === undefined) parsedStats.longestStreak = 0;
        if (parsedStats.fastestTime === undefined) parsedStats.fastestTime = null;
        
        return parsedStats;
      }
    } catch (error) {
      console.error("Error parsing stats, using defaults:", error);
    }
    
    console.log("📝 ConnectionsResults: No stats found, using defaults");
    return defaultStats;
  };
  
  const saveStats = async (stats: LifetimeStats): Promise<void> => {
    console.log("💾 ConnectionsResults: Saving stats to AsyncStorage:", stats);
    try {
      await setItem({ key: "connections-stats", value: JSON.stringify(stats) });
      console.log("✅ ConnectionsResults: Stats saved successfully");
    } catch (error) {
      console.error("Error saving stats:", error);
      throw error;
    }
  };
  
  return { loadStats, saveStats };
}

/**
 * Hook for managing user ID with Shopify AsyncStorage
 */
export function useUserId() {
  const { getItem, setItem } = useAsyncStorage();
  
  const getUserId = async (): Promise<string> => {
    console.log('🔑 Getting user ID from AsyncStorage');
    try {
      let userId = await getItem({ key: "connections-user-id" });
      
      if (!userId) {
        // Generate a simple user ID based on timestamp and random number
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('🆔 Generated new user ID:', userId);
        await setItem({ key: "connections-user-id", value: userId });
        console.log('💾 Saved new user ID to AsyncStorage');
      } else {
        console.log('✅ Found existing user ID:', userId);
      }
      
      return userId;
    } catch (error) {
      console.error('Error managing user ID:', error);
      // Fallback to a temporary ID if storage fails
      return `temp_user_${Date.now()}`;
    }
  };
  
  return { getUserId };
}

/**
 * Legacy function for backward compatibility - Load lifetime stats from localStorage
 * @deprecated Use useLifetimeStats hook instead
 */
export function loadStats(): LifetimeStats {
  console.log("📖 ConnectionsResults: Loading local stats from localStorage");
  const stored = localStorage.getItem("connections-stats");
  
  const defaultStats: LifetimeStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    totalTime: 0,
    totalMistakes: 0,
    totalGuesses: 0,
    winDates: [],
    currentStreak: 0,
    longestStreak: 0,
    fastestTime: null,
  };
  
  if (stored) {
    try {
      const parsedStats = JSON.parse(stored);
      console.log("✅ ConnectionsResults: Local stats found:", parsedStats);
      
      // Ensure all required fields exist (backward compatibility)
      const mergedStats: LifetimeStats = {
        ...defaultStats,
        ...parsedStats,
        // Ensure new fields exist
        winDates: parsedStats.winDates || [],
        currentStreak: parsedStats.currentStreak || 0,
        longestStreak: parsedStats.longestStreak || 0,
        fastestTime: parsedStats.fastestTime || null,
      };
      
      return mergedStats;
    } catch (error) {
      console.error("Error parsing local stats, using defaults:", error);
      return defaultStats;
    }
  }
  
  console.log("📝 ConnectionsResults: No local stats found, using defaults");
  return defaultStats;
}

/**
 * Legacy function for backward compatibility - Save lifetime stats to localStorage
 * @deprecated Use useLifetimeStats hook instead
 */
export function saveStats(stats: LifetimeStats) {
  console.log("💾 ConnectionsResults: Saving stats to localStorage:", stats);
  localStorage.setItem("connections-stats", JSON.stringify(stats));
  console.log("✅ ConnectionsResults: Stats saved successfully");
}

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday's date as YYYY-MM-DD string
 */
function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Calculate current streak based on consecutive win dates
 */
function calculateCurrentStreak(winDates: string[]): number {
  if (winDates.length === 0) return 0;
  
  // Sort dates in descending order (most recent first)
  const sortedDates = [...winDates].sort().reverse();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  
  let currentStreak = 0;
  let expectedDate = today;
  
  // If the most recent win wasn't today, check if it was yesterday
  if (sortedDates[0] !== today) {
    if (sortedDates[0] !== yesterday) {
      return 0; // Streak is broken if last win wasn't today or yesterday
    }
    expectedDate = yesterday;
  }
  
  // Count consecutive days working backwards
  for (const winDate of sortedDates) {
    if (winDate === expectedDate) {
      currentStreak++;
      // Move to previous day
      const prevDate = new Date(expectedDate);
      prevDate.setDate(prevDate.getDate() - 1);
      expectedDate = prevDate.toISOString().split('T')[0];
    } else {
      break; // Streak is broken
    }
  }
  
  return currentStreak;
}

/**
 * Calculate longest streak from win dates
 */
function calculateLongestStreak(winDates: string[]): number {
  if (winDates.length === 0) return 0;
  
  const sortedDates = [...winDates].sort();
  let longestStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currentDate = new Date(sortedDates[i]);
    const dayDifference = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (dayDifference === 1) {
      // Consecutive day
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      // Reset streak
      currentStreak = 1;
    }
  }
  
  return longestStreak;
}

/**
 * Update local stats with new game results
 */
export function updateLocalStats(
  won: boolean,
  elapsedSeconds: number,
  mistakes: number,
  totalGuesses: number
): LifetimeStats {
  console.log("📈 ConnectionsResults: Updating local storage stats");
  const stats = loadStats();
  console.log("📊 ConnectionsResults: Current local stats:", stats);

  stats.gamesPlayed += 1;
  stats.totalTime += elapsedSeconds;
  stats.totalMistakes += mistakes;
  stats.totalGuesses += totalGuesses;
  
  if (won) {
    stats.gamesWon += 1;
    
    // Update fastest time
    if (stats.fastestTime === null || elapsedSeconds < stats.fastestTime) {
      stats.fastestTime = elapsedSeconds;
      console.log("🎯 ConnectionsResults: New personal best time:", elapsedSeconds);
    }
    
    // Add today's date to win dates (only if not already added today)
    const today = getTodayDateString();
    if (!stats.winDates.includes(today)) {
      stats.winDates.push(today);
      console.log("📅 ConnectionsResults: Added win date:", today);
      
      // Recalculate streaks
      stats.currentStreak = calculateCurrentStreak(stats.winDates);
      stats.longestStreak = Math.max(stats.longestStreak, calculateLongestStreak(stats.winDates));
      
      console.log("🔥 ConnectionsResults: Current streak:", stats.currentStreak);
      console.log("🏆 ConnectionsResults: Longest streak:", stats.longestStreak);
    } else {
      console.log("📅 ConnectionsResults: Already won today, streak unchanged");
    }
  }
  
  saveStats(stats);
  console.log("✅ ConnectionsResults: Updated local stats:", stats);
  
  return stats;
}

/**
 * Create progress data object for API submission
 */
export function createProgressData(
  userId: string,
  elapsedSeconds: number,
  solvedCategoriesCount: number,
  won: boolean,
  mistakes: number
): ProgressData {
  // Calculate lives remaining based on mistakes (assuming max 4 lives, 1 lost per mistake)
  const maxLives = 4;
  const livesRemaining = Math.max(0, maxLives - mistakes);

  return {
    user_id: userId,
    completion_time: elapsedSeconds,
    score: solvedCategoriesCount * 100, // Simple scoring: 100 points per solved category
    completed: won,
    lives_remaining: livesRemaining,
    game_type: "connections",
  };
}

/**
 * Submit game results and generate local user stats (no backend)
 */
export async function submitGameResults(
  progressData: ProgressData
): Promise<{
  userStats: UserStats;
  personalStats: PersonalStats;
}> {
  console.log(
    "📤 ConnectionsResults: Processing game results locally:",
    progressData
  );

  // Update local stats
  updateLocalStats(
    progressData.completed,
    progressData.completion_time,
    4 - progressData.lives_remaining, // Convert lives to mistakes
    4 // Assume 4 total guesses for now
  );

  // Load updated stats
  const stats = loadStats();

  // Generate user stats from local data
  const userStats: UserStats = {
    user_id: progressData.user_id,
    total_games_played: stats.gamesPlayed,
    best_time: stats.fastestTime || undefined,
    average_time: stats.gamesWon > 0 ? Math.round(stats.totalTime / stats.gamesWon) : undefined,
    average_lives_remaining: stats.gamesWon > 0 ? Math.round((4 - stats.totalMistakes / stats.gamesWon) * 10) / 10 : undefined,
    total_score: stats.gamesWon * 400, // 400 points per win
    current_streak: stats.currentStreak,
    longest_streak: stats.longestStreak,
    last_played: new Date().toISOString(),
  };

  // Calculate personal stats from local storage
  const personalStats: PersonalStats = {
    average_completion_time: stats.gamesWon > 0 ? 
      Math.round(stats.totalTime / stats.gamesWon) : 0,
    average_lives_remaining: stats.gamesWon > 0 ? 
      Math.round((4 - stats.totalMistakes / stats.gamesWon) * 10) / 10 : 0,
    total_games_played: stats.gamesPlayed,
    completion_rate: stats.gamesPlayed > 0 ? 
      Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0,
  };
  console.log("👤 ConnectionsResults: User stats generated:", userStats);
  console.log("🎉 ConnectionsResults: All data processed successfully!");

  return {
    userStats,
    personalStats,
  };
}

/**
 * Get current streak information
 */
export function getCurrentStreak(): { current: number; longest: number } {
  const stats = loadStats();
  
  return {
    current: stats.currentStreak,
    longest: stats.longestStreak
  };
}


/**
 * Get longest streak from stats
 */
export function getLongestStreak(): number {
  const stats = loadStats();
  return stats.longestStreak;
}

/**
 * Get fastest time from stats
 */
export function getFastestTime(): number | null {
  const stats = loadStats();
  return stats.fastestTime;
}

/**
 * Get personal average lives remaining from past wins
 */
export function getAverageLivesRemaining(): number {
  const stats = loadStats();
  if (stats.gamesWon === 0) return 0;
  
  // Calculate average mistakes per win, then convert to lives
  const avgMistakes = stats.totalMistakes / stats.gamesWon;
  const avgLives = Math.max(0, 4 - avgMistakes);
  return Math.round(avgLives * 10) / 10; // Round to 1 decimal place
}

/**
 * Get win rate percentage
 */
export function getWinRate(): number {
  const stats = loadStats();
  if (stats.gamesPlayed === 0) return 0;
  return Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
}

/**
 * Get average completion time for wins
 */
export function getAverageWinTime(): number {
  const stats = loadStats();
  if (stats.gamesWon === 0) return 0;
  return Math.round(stats.totalTime / stats.gamesWon);
}

/**
 * Generate or get user ID from localStorage
 */
export function getUserId(): string {
  console.log('🔑 Getting user ID from localStorage');
  const storageKey = 'connections-user-id';
  let userId = localStorage.getItem(storageKey);
  
  if (!userId) {
    // Generate a simple user ID based on timestamp and random number
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 Generated new user ID:', userId);
    localStorage.setItem(storageKey, userId);
    console.log('💾 Saved new user ID to localStorage');
  } else {
    console.log('✅ Found existing user ID:', userId);
  }
  
  return userId;
}

/**
 * Get how many more lives user has compared to their average
 */
export function getLivesComparedToAverage(currentLivesRemaining: number): { 
  difference: number | null; 
  isAboveAverage: boolean;
  averageLives: number | null;
} {
  const stats = loadStats();
  
  if (stats.gamesWon === 0) {
    return { 
      difference: null, 
      isAboveAverage: false,
      averageLives: null 
    };
  }
  
  const averageLives = getAverageLivesRemaining();
  const difference = currentLivesRemaining - averageLives;
  
  return {
    difference: Math.round(difference * 10) / 10,
    isAboveAverage: difference > 0,
    averageLives: averageLives
  };
}

/**
 * Check if current time is a new personal record
 */
export function isNewPersonalRecord(completionTime: number): boolean {
  const fastest = getFastestTime();
  return !fastest || completionTime < fastest;
}

/**
 * Generate share text for the game results
 */
export function createShareText(won: boolean, elapsedSeconds: number, mistakes: number): string {
  const streak = getCurrentStreak();
  const streakText = streak.current > 0 ? ` 🔥${streak.current}-day streak!` : '';
  
  return `Shopify Connections – ${
    won ? "Won" : "Lost"
  } in ${elapsedSeconds}s with ${mistakes} mistakes.${streakText} Can you beat me?`;
}
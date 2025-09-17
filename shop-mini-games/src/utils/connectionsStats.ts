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
 * Load lifetime stats from localStorage
 */
export function loadStats(): LifetimeStats {
  console.log("📖 ConnectionsResults: Loading local stats from localStorage");
  const stored = localStorage.getItem("connections-stats");
  if (stored) {
    const parsedStats = JSON.parse(stored);
    console.log("✅ ConnectionsResults: Local stats found:", parsedStats);
    
    // Ensure backward compatibility - add new fields if they don't exist
    if (!parsedStats.winDates) parsedStats.winDates = [];
    if (parsedStats.currentStreak === undefined) parsedStats.currentStreak = 0;
    if (parsedStats.longestStreak === undefined) parsedStats.longestStreak = 0;
    if (parsedStats.fastestTime === undefined) parsedStats.fastestTime = null;
    
    return parsedStats;
  }
  console.log("📝 ConnectionsResults: No local stats found, using defaults");
  return {
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
        // Ensure successfulAttempts is always an array
        successfulAttempts: parsedStats.successfulAttempts || [],
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
 * Save lifetime stats to localStorage
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
 * Helper function to generate or get user ID
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
 * Update and calculate user streak based on local storage
 * Streak is based on consecutive days with at least one win
 */
function updateUserStreak(won: boolean): { current_streak: number; longest_streak: number } {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  
  const lastPlayedKey = 'connections-last-played';
  const lastWonKey = 'connections-last-won';
  const streakKey = 'connections-streak';
  const longestStreakKey = 'connections-longest-streak';
  
  const lastPlayed = localStorage.getItem(lastPlayedKey);
  const lastWon = localStorage.getItem(lastWonKey);
  const currentStreak = parseInt(localStorage.getItem(streakKey) || '0');
  const longestStreak = parseInt(localStorage.getItem(longestStreakKey) || '0');
  
  let newCurrentStreak = currentStreak;
  let newLongestStreak = longestStreak;
  
  if (won) {
    if (lastWon === today) {
      // Already won today, streak unchanged
    } else if (lastWon === yesterday || currentStreak === 0) {
      // Won yesterday (consecutive) or starting new streak
      newCurrentStreak = currentStreak + 1;
      if (newCurrentStreak > longestStreak) {
        newLongestStreak = newCurrentStreak;
      }
    } else {
      // Gap in playing, restart streak
      newCurrentStreak = 1;
    }
    
    // Update last won date
    localStorage.setItem(lastWonKey, today);
  } else {
    // Check if we missed yesterday and should reset streak
    if (lastPlayed && lastPlayed !== today && lastPlayed !== yesterday && lastWon !== yesterday) {
      newCurrentStreak = 0;
    }
  }
  
  // Update localStorage
  localStorage.setItem(lastPlayedKey, today);
  localStorage.setItem(streakKey, newCurrentStreak.toString());
  localStorage.setItem(longestStreakKey, newLongestStreak.toString());
  
  console.log(`🔥 Streak updated: current=${newCurrentStreak}, longest=${newLongestStreak}`);
  
  return {
    current_streak: newCurrentStreak,
    longest_streak: newLongestStreak
  };
}

/**
 * Get or update the fastest time record
 */
function updateFastestTime(completionTime: number, won: boolean): number | undefined {
  const fastestTimeKey = 'connections-fastest-time';
  const currentFastest = localStorage.getItem(fastestTimeKey);
  
  if (!won) {
    return currentFastest ? parseInt(currentFastest) : undefined;
  }
  
  if (!currentFastest || completionTime < parseInt(currentFastest)) {
    localStorage.setItem(fastestTimeKey, completionTime.toString());
    console.log(`⚡ New fastest time record: ${completionTime}s`);
    return completionTime;
  }
  
  return parseInt(currentFastest);
}

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

  // Get local stats
  const localStats = loadStats();
  const { current_streak, longest_streak } = updateUserStreak(progressData.completed);
  const fastestTime = updateFastestTime(progressData.completion_time, progressData.completed);
  
  // Calculate average lives remaining from successful attempts only
  const averageLivesFromSuccessfulAttempts = localStats.successfulAttempts.length > 0 ?
    localStats.successfulAttempts.reduce((sum, attempt) => sum + attempt.livesRemaining, 0) / localStats.successfulAttempts.length :
    undefined;
  
  // Generate user stats from local data
  const userStats: UserStats = {
    user_id: progressData.user_id,
    total_games_played: localStats.gamesPlayed,
    best_time: fastestTime,
    average_time: localStats.gamesWon > 0 ? Math.round(localStats.totalTime / localStats.gamesWon) : undefined,
    average_lives_remaining: averageLivesFromSuccessfulAttempts ? 
      Math.round(averageLivesFromSuccessfulAttempts * 10) / 10 : undefined,
    total_score: localStats.gamesWon * 400, // 400 points per win
    current_streak,
    longest_streak,
    last_played: new Date().toISOString(),
  };

  // Calculate personal stats from local storage
  const personalStats: PersonalStats = {
    average_completion_time: localStats.gamesWon > 0 ? 
      Math.round(localStats.totalTime / localStats.gamesWon) : 0,
    average_lives_remaining: averageLivesFromSuccessfulAttempts || 0,
    total_games_played: localStats.gamesPlayed,
    completion_rate: localStats.gamesPlayed > 0 ? 
      Math.round((localStats.gamesWon / localStats.gamesPlayed) * 100) : 0,
  };

  console.log("👤 ConnectionsResults: User stats generated:", userStats);
  console.log("📊 ConnectionsResults: Personal stats generated:", personalStats);
  console.log("🎉 ConnectionsResults: All data processed successfully!");

  return {
    userStats,
    personalStats,
  };
}

/**
 * Get how many more lives user has compared to their average successful attempts
 */
export function getLivesComparedToAverage(currentLivesRemaining: number): { 
  difference: number | null; 
  isAboveAverage: boolean;
  averageLives: number | null;
} {
  const localStats = loadStats();
  
  if (localStats.successfulAttempts.length === 0) {
    return { 
      difference: null, 
      isAboveAverage: false,
      averageLives: null 
    };
  }
  
  const averageLives = localStats.successfulAttempts.reduce((sum, attempt) => sum + attempt.livesRemaining, 0) / localStats.successfulAttempts.length;
  const difference = currentLivesRemaining - averageLives;
  
  return {
    difference: Math.round(difference * 10) / 10,
    isAboveAverage: difference > 0,
    averageLives: Math.round(averageLives * 10) / 10
  };
}

/**
 * Get current fastest time from local storage
 */
export function getFastestTime(): number | null {
  const fastestTimeKey = 'connections-fastest-time';
  const fastest = localStorage.getItem(fastestTimeKey);
  return fastest ? parseInt(fastest) : null;
}

/**
 * Check if current time is a new personal record
 */
export function isNewPersonalRecord(completionTime: number): boolean {
  const fastest = getFastestTime();
  return !fastest || completionTime < fastest;
}

/**
 * Get current streak information
 */
export function getCurrentStreak(): { current: number; longest: number } {
  const currentStreak = parseInt(localStorage.getItem('connections-streak') || '0');
  const longestStreak = parseInt(localStorage.getItem('connections-longest-streak') || '0');
  
  return {
    current: currentStreak,
    longest: longestStreak
  };
}

/**
 * Get current streak from stats
 */
export function getCurrentStreak(): number {
  const stats = loadStats();
  return stats.currentStreak;
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
 * Generate share text for the game results
 */
export function createShareText(won: boolean, elapsedSeconds: number, mistakes: number): string {
  const streak = getCurrentStreak();
  const streakText = streak.current > 0 ? ` 🔥${streak.current}-day streak!` : '';
  
  return `Shopify Connections – ${
    won ? "Won" : "Lost"
  } in ${elapsedSeconds}s with ${mistakes} mistakes.${streakText} Can you beat me?`;
}

import { apiClient, UserStats, GameStats, LeaderboardResponse } from "./api";

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
 * Submit game results and fetch all related data from the backend
 */
export async function submitGameResults(
  progressData: ProgressData
): Promise<{
  userStats: UserStats;
  gameStats: GameStats;
  leaderboard: LeaderboardResponse;
}> {
  console.log(
    "📤 ConnectionsResults: Submitting progress data to backend:",
    progressData
  );

  // Submit to backend
  const submitResponse = await apiClient.submitProgress(progressData);
  console.log(
    "✅ ConnectionsResults: Progress submitted successfully:",
    submitResponse
  );

  // Fetch all related data
  console.log("📊 ConnectionsResults: Fetching user stats for user:", progressData.user_id);
  console.log("🎯 ConnectionsResults: Fetching game statistics for connections");
  console.log("🏆 ConnectionsResults: Fetching leaderboard (top 10)");

  const [userStats, gameStats, leaderboard] = await Promise.all([
    apiClient.getUserStats(progressData.user_id),
    apiClient.getGameStats("connections"),
    apiClient.getLeaderboard(10),
  ]);

  console.log("👤 ConnectionsResults: User stats received:", userStats);
  console.log("🎮 ConnectionsResults: Game stats received:", gameStats);
  console.log("📈 ConnectionsResults: Leaderboard data received:", leaderboard);
  console.log("🎉 ConnectionsResults: All data fetched successfully!");

  return {
    userStats,
    gameStats,
    leaderboard,
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
  return `Shopify Connections – ${
    won ? "Won" : "Lost"
  } in ${elapsedSeconds}s with ${mistakes} mistakes. Can you beat me?`;
}

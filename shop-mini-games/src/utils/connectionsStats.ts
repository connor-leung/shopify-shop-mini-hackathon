import { apiClient, UserStats, GameStats, LeaderboardResponse } from "./api";

export interface LifetimeStats {
  gamesPlayed: number;
  gamesWon: number;
  totalTime: number; // seconds
  totalMistakes: number;
  totalGuesses: number;
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
    return parsedStats;
  }
  console.log("📝 ConnectionsResults: No local stats found, using defaults");
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    totalTime: 0,
    totalMistakes: 0,
    totalGuesses: 0,
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
  if (won) stats.gamesWon += 1;
  stats.totalTime += elapsedSeconds;
  stats.totalMistakes += mistakes;
  stats.totalGuesses += totalGuesses;
  
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
 * Generate share text for the game results
 */
export function createShareText(won: boolean, elapsedSeconds: number, mistakes: number): string {
  return `Shopify Connections – ${
    won ? "Won" : "Lost"
  } in ${elapsedSeconds}s with ${mistakes} mistakes. Can you beat me?`;
}

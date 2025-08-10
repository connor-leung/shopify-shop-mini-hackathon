import React, { useEffect, useState, useRef } from "react";
import { GameResults } from "./ConnectionsGame";
import {
  getUserId,
  UserStats,
  GameStats,
  LeaderboardResponse,
} from "../utils/api";
import {
  loadStats,
  updateLocalStats,
  createProgressData,
  submitGameResults,
  createShareText,
} from "../utils/connectionsStats";

interface ConnectionsResultsProps {
  results: GameResults;
  onPlayAgain: () => void;
  onBackHome?: () => void;
}

export default function ConnectionsResults({
  results,
  onPlayAgain,
  onBackHome,
}: ConnectionsResultsProps) {
  console.log(
    "🎮 ConnectionsResults: Component initialized with results:",
    results
  );

  const { won, mistakes, elapsedSeconds, totalGuesses, solvedCategories } =
    results;
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const userId = getUserId();
  console.log("👤 ConnectionsResults: User ID generated:", userId);

  // Persist lifetime stats and submit to backend
  useEffect(() => {
    console.log(
      "🚀 ConnectionsResults: useEffect triggered, starting data submission process"
    );

    const submitResults = async () => {
      console.log("📊 ConnectionsResults: Setting isSubmitting to true");
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        // Update local storage stats first
        updateLocalStats(won, elapsedSeconds, mistakes, totalGuesses);

        // Create progress data for API submission
        const progressData = createProgressData(
          userId,
          elapsedSeconds,
          solvedCategories.length,
          won,
          mistakes
        );

        // Submit to backend and fetch all related data
        const { userStats, gameStats, leaderboard } = await submitGameResults(
          progressData
        );

        // Update component state with fetched data
        setUserStats(userStats);
        setGameStats(gameStats);
        setLeaderboard(leaderboard);
      } catch (error) {
        console.error(
          "❌ ConnectionsResults: Failed to submit results:",
          error
        );
        console.error("🔍 ConnectionsResults: Error details:", {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          type: typeof error,
          error,
        });
        setSubmitError(
          "Failed to sync with server. Your local stats were saved."
        );
      } finally {
        console.log("🏁 ConnectionsResults: Setting isSubmitting to false");
        setIsSubmitting(false);
      }
    };

    submitResults();
  }, []); // Only run once when component mounts

  const shareText = createShareText(won, elapsedSeconds, mistakes);

  const lifetime = loadStats();

  // Carousel data
  const carouselItems = [
    { label: "Time", value: `${elapsedSeconds}s` },
    { label: "Mistakes", value: mistakes.toString() },
    { label: "Guesses", value: totalGuesses.toString() },
    { label: "Categories", value: solvedCategories.length.toString() },
  ];

  // Navigation functions
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
  };

  const goToPrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + carouselItems.length) % carouselItems.length
    );
  };

  // Swipe handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  };

  // Auto-scroll effect (paused during touch interaction)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-advance if user is not currently touching
      if (touchStart === null) {
        goToNext();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [touchStart]);

  // Scroll to current item
  useEffect(() => {
    if (carouselRef.current) {
      const itemWidth = 248; // 240px + 8px gap
      carouselRef.current.scrollTo({
        left: currentIndex * itemWidth,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  console.log("🎨 ConnectionsResults: Rendering component with state:", {
    isSubmitting,
    submitError,
    hasUserStats: !!userStats,
    hasGameStats: !!gameStats,
    hasLeaderboard: !!leaderboard,
    userStats: userStats,
    gameStats: gameStats,
    leaderboard: leaderboard,
  });

  return (
    <div className="pt-12 px-4 pb-8 max-w-xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">
        {won ? "On fire! 🎉" : "Better luck next time"}
      </h1>

      {/* Error message */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-800 text-sm">
          {submitError}
          <button
            onClick={() => {
              console.log(
                "🔄 ConnectionsResults: Retry button clicked, clearing error and retrying"
              );
              setSubmitError(null);
              // Trigger retry by calling the submission function again
              const retrySubmission = async () => {
                setIsSubmitting(true);
                try {
                  const progressData = createProgressData(
                    userId,
                    elapsedSeconds,
                    solvedCategories.length,
                    won,
                    mistakes
                  );

                  console.log(
                    "🔄 ConnectionsResults: Retrying with data:",
                    progressData
                  );

                  // Submit to backend and fetch all related data
                  const { userStats, gameStats, leaderboard } =
                    await submitGameResults(progressData);

                  console.log("✅ ConnectionsResults: Retry successful!");

                  // Update component state
                  setUserStats(userStats);
                  setGameStats(gameStats);
                  setLeaderboard(leaderboard);
                } catch (error) {
                  console.error("❌ ConnectionsResults: Retry failed:", error);
                  setSubmitError("Retry failed. Please check your connection.");
                } finally {
                  setIsSubmitting(false);
                }
              };
              retrySubmission();
            }}
            className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {isSubmitting && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-blue-800 text-sm">
          Syncing with server...
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center max-w-full mx-auto relative">
        {/* Swipe Instructions */}
        <div className="text-xs text-gray-500 mb-2">Swipe to navigate</div>

        {/* Carousel Container with Touch Events */}
        <div
          className="overflow-hidden touch-pan-y select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            ref={carouselRef}
            className="flex gap-4 transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * 248}px)`,
              width: `${carouselItems.length * 248}px`,
            }}
          >
            {/* Render items multiple times for infinite effect */}
            {[...carouselItems, ...carouselItems, ...carouselItems].map(
              (item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className="bg-white rounded-lg p-4 border aspect-square flex flex-col justify-center min-w-[240px] flex-shrink-0"
                >
                  <p className="text-xs text-gray-600 mb-1">{item.label}</p>
                  <p className="text-lg font-bold">{item.value}</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-4 gap-2">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-blue-600" : "bg-gray-300"
              }`}
              aria-label={`Go to stat ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Share */}
      <button
        onClick={() => {
          console.log(
            "📋 ConnectionsResults: Share button clicked, copying to clipboard:",
            shareText
          );
          navigator.clipboard.writeText(shareText);
        }}
        className="w-full mb-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Copy Results & Share
      </button>

      {/* Play again */}
      <button
        onClick={() => {
          console.log("🔄 ConnectionsResults: Play Again button clicked");
          onPlayAgain();
        }}
        className="w-full mb-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Play Again
      </button>

      {onBackHome && (
        <button
          className="text-sm text-blue-600 underline"
          onClick={() => {
            console.log("🏠 ConnectionsResults: Back Home button clicked");
            onBackHome();
          }}
        >
          Back Home
        </button>
      )}

      {/* Server Stats Section */}
      {userStats && (
        <div className="mt-8 bg-blue-50 rounded-lg p-4 text-left">
          <h2 className="font-semibold mb-2 text-blue-900">
            Your Server Stats
          </h2>
          <p className="mb-1">
            <strong>Games Played:</strong> {userStats.total_games_played}
          </p>
          <p className="mb-1">
            <strong>Best Time:</strong>{" "}
            {userStats.best_time ? `${userStats.best_time}s` : "N/A"}
          </p>
          <p className="mb-1">
            <strong>Average Time:</strong>{" "}
            {userStats.average_time
              ? `${Math.round(userStats.average_time)}s`
              : "N/A"}
          </p>
          <p className="mb-1">
            <strong>Current Streak:</strong> {userStats.current_streak}
          </p>
          <p className="mb-1">
            <strong>Longest Streak:</strong> {userStats.longest_streak}
          </p>
          <p className="mb-1">
            <strong>Total Score:</strong> {userStats.total_score}
          </p>
        </div>
      )}

      {/* Game Statistics */}
      {gameStats && (
        <div className="mt-4 bg-green-50 rounded-lg p-4 text-left">
          <h2 className="font-semibold mb-2 text-green-900">
            Global Game Stats
          </h2>
          <p className="mb-1">
            <strong>Total Players:</strong> {gameStats.total_players}
          </p>
          <p className="mb-1">
            <strong>Games Played:</strong> {gameStats.total_games_played}
          </p>
          <p className="mb-1">
            <strong>Average Completion Time:</strong>{" "}
            {gameStats.average_completion_time}s
          </p>
          <p className="mb-1">
            <strong>Completion Rate:</strong> {gameStats.completion_rate}%
          </p>
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard && leaderboard.entries.length > 0 && (
        <div className="mt-4 bg-yellow-50 rounded-lg p-4 text-left">
          <h2 className="font-semibold mb-2 text-yellow-900">Top Players</h2>
          <div className="space-y-1">
            {leaderboard.entries.slice(0, 5).map((entry, index) => (
              <div
                key={entry.user_id}
                className="flex justify-between items-center text-sm"
              >
                <span
                  className={`${
                    entry.user_id === userId ? "font-bold text-yellow-800" : ""
                  }`}
                >
                  #{index + 1}{" "}
                  {entry.user_id === userId ? "(You)" : entry.user_id.slice(-8)}
                </span>
                <span className="font-mono">{entry.best_time}s</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Total players: {leaderboard.total_users}
          </p>
        </div>
      )}

      {/* Local Lifetime Stats (fallback) */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4 text-left">
        <h2 className="font-semibold mb-2">Local Stats</h2>
        <p className="mb-1">
          <strong>Games Played:</strong> {lifetime.gamesPlayed}
        </p>
        <p className="mb-1">
          <strong>Games Won:</strong> {lifetime.gamesWon}
        </p>
        <p className="mb-1">
          <strong>Average Time:</strong>{" "}
          {lifetime.gamesPlayed
            ? Math.round(lifetime.totalTime / lifetime.gamesPlayed)
            : 0}
          s
        </p>
        <p className="mb-1">
          <strong>Total Mistakes:</strong> {lifetime.totalMistakes}
        </p>
        <p className="mb-1">
          <strong>Total Guesses:</strong> {lifetime.totalGuesses}
        </p>
      </div>
    </div>
  );
}

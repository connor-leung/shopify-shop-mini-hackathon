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
  onNavigate?: (page: string) => void;
}

// Confetti component
const Confetti = ({ show }: { show: boolean }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 50 }, (_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 opacity-80 animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-100px`, // Start above the viewport
            backgroundColor: [
              "#ff6b6b",
              "#4ecdc4",
              "#45b7d1",
              "#96ceb4",
              "#ffeaa7",
              "#dda0dd",
            ][Math.floor(Math.random() * 6)],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
};

interface ConnectionsResultsProps {
  results: GameResults;
  onPlayAgain: () => void;
  onBackHome?: () => void;
  onNavigate?: (page: string) => void;
}

export default function ConnectionsResults({
  results,
  onPlayAgain,
  onBackHome,
  onNavigate,
}: ConnectionsResultsProps) {
  console.log(
    "🎮 ConnectionsResults: Component initialized with results:",
    results
  );

  const { won, mistakes, elapsedSeconds, totalGuesses, solvedCategories } = results;
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Confetti state
  const [showConfetti, setShowConfetti] = useState(false);

  // Helper function to calculate speed percentage
  const getSpeedPercentage = () => {
    if (
      !gameStats ||
      !gameStats.average_completion_time ||
      gameStats.average_completion_time <= 0
    ) {
      return null;
    }

    const averageTime = gameStats.average_completion_time;
    const userTime = elapsedSeconds;

    console.log("🏃‍♂️ Speed calculation:", {
      averageTime,
      userTime,
      gameStats: gameStats,
    });

    if (userTime >= averageTime) {
      return null; // User is not faster
    }

    const percentageFaster = Math.round(
      ((averageTime - userTime) / averageTime) * 100
    );

    console.log("📊 Raw percentage faster:", percentageFaster);

    // Round to nearest milestone: 25%, 50%, 75%, or 90%
    if (percentageFaster >= 85) return 90;
    if (percentageFaster >= 62.5) return 75;
    if (percentageFaster >= 37.5) return 50;
    if (percentageFaster >= 12.5) return 25;
    return null;
  };

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const userId = getUserId();
  console.log("👤 ConnectionsResults: User ID generated:", userId);

  // Trigger confetti when user wins
  useEffect(() => {
    if (won) {
      setShowConfetti(true);
      // Hide confetti after 4 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [won]);

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

  // Navigation functions
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % 4); // 4 carousel items
  };

  const goToPrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + 4) % 4 // 4 carousel items
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

  // Scroll to current item - not needed since we're using transform
  useEffect(() => {
    // Transform handles positioning, no need for scroll
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
    <div
      className="min-h-screen w-full"
      style={{ background: "linear-gradient(to bottom, #FAFAFA, #EEEAFF)" }}
    >
      <Confetti show={showConfetti} />
      <div className="pt-12 px-4 pb-8 max-w-xl mx-auto text-center">
        <h1 className="mb-4">
          {won ? (
            <div className="flex flex-col">
              <span className="text-3xl font-bold pb-2">On fire! 🎉</span>
              <span>
                Today's avg:{" "}
                {gameStats?.average_completion_time
                  ? `${Math.round(gameStats.average_completion_time)}s`
                  : "Loading..."}
              </span>
            </div>
          ) : (
            <>
              <span className="text-3xl">Better luck next time ☔</span>
            </>
          )}
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
                    console.error(
                      "❌ ConnectionsResults: Retry failed:",
                      error
                    );
                    setSubmitError(
                      "Retry failed. Please check your connection."
                    );
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
        <div className="flex flex-col items-center"></div>
        <div className="rounded-lg p-6 mb-6 text-center max-w-full mx-auto relative">
          {won && (
            <>
              <div
                className="overflow-hidden touch-pan-y select-none w-full"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div className="w-[280px] mx-auto relative overflow-hidden">
                  <div
                    ref={carouselRef}
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{
                      transform: `translateX(-${currentIndex * 280}px)`,
                    }}
                  >
                    {/* Streaks Component - NEW FIRST COMPONENT */}
                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <span className="text-5xl pb-4">🔥</span>
                      <p className="text-2xl font-bold mb-2">Current Streak</p>
                      <p className="text-xl font-bold text-gray-900">
                        {`${userStats?.current_streak || 0}  -day streak`}
                      </p>
                      {userStats &&
                        gameStats &&
                        (() => {
                          // Calculate average streak comparison (we'll use a mock average since it's not in gameStats)
                          const avgStreak = 2; // Assumed average streak
                          const userStreak = userStats.current_streak || 0;
                          if (userStreak <= avgStreak) return null;

                          const percentageBetter = Math.round(
                            ((userStreak - avgStreak) / avgStreak) * 100
                          );

                          // Round to nearest milestone
                          let displayPercentage;
                          if (percentageBetter >= 85) displayPercentage = 90;
                          else if (percentageBetter >= 62.5)
                            displayPercentage = 75;
                          else if (percentageBetter >= 37.5)
                            displayPercentage = 50;
                          else if (percentageBetter >= 12.5)
                            displayPercentage = 25;
                          else displayPercentage = null;

                          return displayPercentage ? (
                            <p className="text-xs text-green-600 mt-1 font-medium">
                              {displayPercentage}% better! 🔥
                            </p>
                          ) : null;
                        })()}
                    </div>

                    {/* Time Component */}
                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Time</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {elapsedSeconds}s
                      </p>
                      {(() => {
                        const speedPercentage = getSpeedPercentage();
                        console.log("🎯 Display percentage:", speedPercentage);
                        return speedPercentage ? (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                            {speedPercentage}% faster! 🏃‍♂️
                          </p>
                        ) : null;
                      })()}
                    </div>

                    {/* Mistakes Component */}
                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Mistakes</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {mistakes}
                      </p>
                      {gameStats &&
                        (() => {
                          // Calculate average mistakes (4 - average_lives_remaining)
                          const avgMistakes = Math.max(
                            0,
                            4 - (gameStats.average_lives_remaining || 2)
                          );
                          const userMistakes = mistakes;
                          if (userMistakes >= avgMistakes) return null; // Only show if better than average

                          const percentageBetter = Math.round(
                            ((avgMistakes - userMistakes) / avgMistakes) * 100
                          );

                          // Round to nearest milestone
                          let displayPercentage;
                          if (percentageBetter >= 85) displayPercentage = 90;
                          else if (percentageBetter >= 62.5)
                            displayPercentage = 75;
                          else if (percentageBetter >= 37.5)
                            displayPercentage = 50;
                          else if (percentageBetter >= 12.5)
                            displayPercentage = 25;
                          else displayPercentage = null;

                          return displayPercentage ? (
                            <p className="text-xs text-green-600 mt-1 font-medium">
                              {displayPercentage}% fewer! 🎯
                            </p>
                          ) : null;
                        })()}
                    </div>

                    {/* Guesses Component */}
                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Guesses</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {totalGuesses}
                      </p>
                      {gameStats &&
                        (() => {
                          // Estimate average guesses based on completion rate and game data
                          const avgGuesses = Math.round(
                            6 + (100 - (gameStats.completion_rate || 50)) / 10
                          );
                          const userGuesses = totalGuesses;
                          if (userGuesses >= avgGuesses) return null; // Only show if better than average

                          const percentageBetter = Math.round(
                            ((avgGuesses - userGuesses) / avgGuesses) * 100
                          );

                          // Round to nearest milestone
                          let displayPercentage;
                          if (percentageBetter >= 85) displayPercentage = 90;
                          else if (percentageBetter >= 62.5)
                            displayPercentage = 75;
                          else if (percentageBetter >= 37.5)
                            displayPercentage = 50;
                          else if (percentageBetter >= 12.5)
                            displayPercentage = 25;
                          else displayPercentage = null;

                          return displayPercentage ? (
                            <p className="text-xs text-green-600 mt-1 font-medium">
                              {displayPercentage}% fewer! 💡
                            </p>
                          ) : null;
                        })()}
                    </div>
                  </div>
                </div>
              </div>
              {/* Dots Indicator - Only show when won */}
              <div className="flex justify-center mt-4 gap-2">
                <button
                  onClick={() => setCurrentIndex(0)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    0 === currentIndex ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  aria-label="Go to Streaks stat"
                />
                <button
                  onClick={() => setCurrentIndex(1)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    1 === currentIndex ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  aria-label="Go to Time stat"
                />
                <button
                  onClick={() => setCurrentIndex(2)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    2 === currentIndex ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  aria-label="Go to Mistakes stat"
                />
                <button
                  onClick={() => setCurrentIndex(3)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    3 === currentIndex ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  aria-label="Go to Guesses stat"
                />
              </div>
            </>
          )}
        </div>

        {/* Share */}
        {won && (
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
        )}

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

        {/* View Game Items */}
        <button
          onClick={() => {
            console.log(
              "📋 ConnectionsResults: View Game Items button clicked"
            );
            if (onNavigate) {
              onNavigate("game-items");
            }
          }}
          className="w-full mb-2 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          View Game Items
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
      </div>
    </div>
  );
}

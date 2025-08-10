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

// Rain component for when user loses
const Rain = ({ show }: { show: boolean }) => {
  if (!show) return null;

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-gray-900 dark-overlay pointer-events-none z-40" />

      {/* Rain drops */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {Array.from({ length: 100 }, (_, i) => (
          <div
            key={i}
            className="absolute w-0.5 opacity-60 animate-rain bg-blue-300"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-100px`,
              height: `${10 + Math.random() * 20}px`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </>
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

  const { mistakes, elapsedSeconds, totalGuesses, solvedCategories } = results;
  const won = results.won; // Use the actual won result from the game
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Confetti and rain state
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRain, setShowRain] = useState(false);

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

  // Trigger confetti (win) or rain (lose) when component mounts
  useEffect(() => {
    if (won) {
      setShowConfetti(true);
      // Hide confetti after 4 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShowRain(true);
      // Keep rain going longer for atmosphere
      const timer = setTimeout(() => {
        setShowRain(false);
      }, 8000);
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
    setCurrentIndex((prev) => (prev + 1) % 5); // 5 carousel items
  };

  const goToPrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + 5) % 5 // 5 carousel items
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
      <Rain show={showRain} />
      <div className="pt-12 px-4 pb-8 max-w-xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">
          {won ? "On fire! 🎉" : "Better luck next time ☔"}
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

        <div className="rounded-lg p-6 mb-6 text-center max-w-full mx-auto relative">
          {won ? (
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
                    {/* Results Image Component */}
                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Results</p>
                      <div className="flex-1 flex items-center justify-center">
                        <a
                          href="https://postimages.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src="https://i.postimg.cc/x8dX3wHV/image.png"
                            alt="Results"
                            className="max-w-full max-h-full object-contain rounded"
                          />
                        </a>
                      </div>
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
                    </div>

                    {/* Guesses Component */}
                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Guesses</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {totalGuesses}
                      </p>
                    </div>

                    {/* Categories Component */}
                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Categories</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {solvedCategories.length}
                      </p>
                    </div>

                    {/* Repeat the components for infinite scroll effect */}
                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Time</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {elapsedSeconds}s
                      </p>
                      {(() => {
                        const speedPercentage = getSpeedPercentage();
                        return speedPercentage ? (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                            {speedPercentage}% faster! 🏃‍♂️
                          </p>
                        ) : null;
                      })()}
                    </div>

                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Mistakes</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {mistakes}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Guesses</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {totalGuesses}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Categories</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {solvedCategories.length}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Results</p>
                      <div className="flex-1 flex items-center justify-center">
                        <a
                          href="https://postimages.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src="https://i.postimg.cc/x8dX3wHV/image.png"
                            alt="Results"
                            className="max-w-full max-h-full object-contain rounded"
                          />
                        </a>
                      </div>
                    </div>

                    {/* Third repetition for infinite scroll */}
                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Time</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {elapsedSeconds}s
                      </p>
                      {(() => {
                        const speedPercentage = getSpeedPercentage();
                        return speedPercentage ? (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                            {speedPercentage}% faster! 🏃‍♂️
                          </p>
                        ) : null;
                      })()}
                    </div>

                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Mistakes</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {mistakes}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Guesses</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {totalGuesses}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Categories</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {solvedCategories.length}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Results</p>
                      <div className="flex-1 flex items-center justify-center">
                        <a
                          href="https://postimages.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src="https://i.postimg.cc/x8dX3wHV/image.png"
                            alt="Results"
                            className="max-w-full max-h-full object-contain rounded"
                          />
                        </a>
                      </div>
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
                  aria-label="Go to Time stat"
                />
                <button
                  onClick={() => setCurrentIndex(1)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    1 === currentIndex ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  aria-label="Go to Mistakes stat"
                />
                <button
                  onClick={() => setCurrentIndex(2)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    2 === currentIndex ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  aria-label="Go to Guesses stat"
                />
                <button
                  onClick={() => setCurrentIndex(3)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    3 === currentIndex ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  aria-label="Go to Categories stat"
                />
                <button
                  onClick={() => setCurrentIndex(4)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    4 === currentIndex ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  aria-label="Go to Results stat"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <a
                href="https://postimages.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-center"
              >
                <img
                  src="https://i.postimg.cc/x8dX3wHV/image.png"
                  alt="image"
                  className="max-w-1/2 max-h-1/2 object-contain rounded mb-4 mx-auto"
                />
              </a>
            </div>
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

        {/* Test Confetti Button */}
        {/* <button
          onClick={() => {
            console.log("🎉 ConnectionsResults: Test Confetti button clicked");
            setShowConfetti(true);
            // Hide confetti after 4 seconds
            setTimeout(() => {
              setShowConfetti(false);
            }, 4000);
          }}
          className="w-full mb-2 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          🎉 Test Confetti
        </button> */}

        {/* Test Rain Button */}
        {/* <button
          onClick={() => {
            console.log("☔ ConnectionsResults: Test Rain button clicked");
            setShowRain(true);
            // Hide rain after 8 seconds
            setTimeout(() => {
              setShowRain(false);
            }, 5000);
          }}
          className="w-full mb-2 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ☔ Test Rain
        </button> */}

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

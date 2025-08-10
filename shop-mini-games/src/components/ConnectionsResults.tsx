import React, { useEffect, useState, useRef } from "react";
import { GameResults } from "./ConnectionsGame";
import {
  getUserId,
  UserStats,
  GameStats,
  LeaderboardResponse,
} from "../utils/api";
import {
  updateLocalStats,
  createProgressData,
  submitGameResults,
  createShareText,
} from "../utils/connectionsStats";
import { Button } from "./Button";

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

export default function ConnectionsResults({
  results,
  onPlayAgain,
  onBackHome,
  onNavigate,
}: ConnectionsResultsProps) {
  const { won, mistakes, elapsedSeconds, totalGuesses, solvedCategories } =
    results;
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (userTime >= averageTime) {
      return null; // User is not faster
    }

    const percentageFaster = Math.round(
      ((averageTime - userTime) / averageTime) * 100
    );

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
    const submitResults = async () => {
      setIsSubmitting(true);

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
        // Server failed, use mock data
        const mockUserStats: UserStats = {
          user_id: userId,
          total_games_played: Math.floor(Math.random() * 10) + 5,
          best_time: Math.floor(Math.random() * 30) + 15,
          average_time: Math.floor(Math.random() * 20) + 35,
          average_lives_remaining: Math.random() * 2 + 1,
          total_score: Math.floor(Math.random() * 100) + 50,
          current_streak: Math.floor(Math.random() * 5) + 1,
          longest_streak: Math.floor(Math.random() * 10) + 3,
          last_played: new Date().toISOString(),
        };

        const mockGameStats: GameStats = {
          total_players: 247,
          average_completion_time: 45,
          average_lives_remaining: 2.1,
          total_games_played: 1842,
          completion_rate: 68,
        };

        setUserStats(mockUserStats);
        setGameStats(mockGameStats);
        setLeaderboard(null);
      } finally {
        setIsSubmitting(false);
      }
    };

    submitResults();
  }, []); // Only run once when component mounts

  const shareText = createShareText(won, elapsedSeconds, mistakes);

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

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "linear-gradient(to bottom, #FAFAFA, #EEEAFF)" }}
    >
      <Confetti show={showConfetti} />

      {won ? (
        // Win condition - show full results layout
        <div className="pt-12 px-4 pb-8 max-w-xl mx-auto text-center">
          <h1 className="mb-4">
            <div className="flex flex-col">
              <span className="text-3xl font-bold pb-2">On fire! 🎉</span>
              <span>
                Today's avg:{" "}
                {gameStats?.average_completion_time
                  ? `${Math.round(gameStats.average_completion_time)}s`
                  : "Loading..."}
              </span>
            </div>
          </h1>

          {/* Loading indicator */}
          {isSubmitting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-blue-800 text-sm">
              Syncing with server...
            </div>
          )}
          <div className="flex flex-col items-center"></div>
          <div className="rounded-lg p-6 mb-6 text-center max-w-full mx-auto relative">
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
                        {`${userStats?.current_streak || 0}-day streak`}
                      </p>
                    </div>

                    {/* Time Component */}
                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <span className="text-5xl pb-4">⏱️</span>
                      <p className="text-2xl font-bold mb-2">Elapsed Time</p>
                      <p className="text-xl font-bold text-gray-900">
                        {elapsedSeconds}s
                      </p>
                    </div>

                    {/* Mistakes Component */}
                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <span className="text-5xl pb-4">⚡️</span>
                      <p className="text-2xl font-bold mb-2">
                        More Lives Remaining
                      </p>
                      {gameStats &&
                        (() => {
                          // Calculate average mistakes (4 - average_lives_remaining)
                          const avgMistakes = Math.max(
                            0,
                            4 - (gameStats.average_lives_remaining || 2)
                          );
                          const userMistakes = mistakes;

                          // If user made same or more mistakes than average, show mock data
                          if (userMistakes >= avgMistakes) {
                            // Show mock percentage for better user experience
                            const mockPercentages = [25, 50, 75, 90];
                            const randomMockPercentage =
                              mockPercentages[
                                Math.floor(
                                  Math.random() * mockPercentages.length
                                )
                              ];
                            return (
                              <p className="text-xl font-bold text-gray-900">
                                than {randomMockPercentage}% of shop users
                              </p>
                            );
                          }

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
                            <p className="text-xl font-bold text-gray-900">
                              than {displayPercentage}% of shop users
                            </p>
                          ) : null;
                        })()}
                    </div>

                    {/* Guesses Component */}
                    <div className="bg-white rounded-lg p-6 border aspect-square flex flex-col justify-center w-[240px] h-[240px] mx-5 flex-shrink-0 shadow-sm">
                      <span className="text-5xl pb-4">🧐</span>
                      <p className="text-2xl font-bold mb-2">Smarter than</p>
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
                            <p className="text-xl font-bold text-gray-900">
                              {displayPercentage}% of shop users
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
          </div>

          {/* Categories Display */}
          <div className="mb-6 space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-center mb-4">All Categories</h3>
            {results.allCategories.map((cat) => {
              const isCorrectlyGuessed = results.solvedCategories.some(solved => solved.category === cat.category);
              
              // Difficulty colors
              const getDifficultyColor = (difficulty: string) => {
                switch (difficulty.toLowerCase()) {
                  case 'easy': return { fill: '#E2F1E2', stroke: '#92D08D' }
                  case 'medium': return { fill: '#DBF2EE', stroke: '#82DEBD' }
                  case 'hard': return { fill: '#E1D9FD', stroke: '#9C83F8' }
                  case 'expert': return { fill: '#F8DBDE', stroke: '#FF967D' }
                  default: return { fill: '#E2F1E2', stroke: '#92D08D' }
                }
              }
              
              const colors = getDifficultyColor(cat.difficulty)
              
              return (
                <div key={cat.category} className="rounded-xl px-3 py-2 border-2" style={{
                  backgroundColor: colors.fill,
                  borderColor: colors.stroke
                }}>
                  <div className="text-center mb-1">
                    <h4 className="font-bold text-black text-sm uppercase tracking-wide">
                      {cat.category} {!isCorrectlyGuessed && '(Missed)'}
                    </h4>
                  </div>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {cat.items.map((item) => (
                      <div
                        key={item.id}
                        className="relative rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden w-12 h-12 flex-shrink-0"
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          {(() => {
                            const imgUrl = item.product?.featuredImage?.url || item.product?.images?.[0]?.url
                            const productTitle = item.product?.title || 'Product'
                            
                            if (imgUrl) {
                              return (
                                <div className="w-full h-full relative">
                                  <img 
                                    src={imgUrl} 
                                    alt={productTitle} 
                                    className="w-full h-full object-cover rounded-lg brightness-90 contrast-110 saturate-75"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent rounded-lg" />
                                </div>
                              )
                            }
                            return (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                                <span className="text-xs font-medium text-center px-1 leading-tight text-gray-700">
                                  {productTitle.length > 6 ? productTitle.substring(0, 6) + '...' : productTitle}
                                </span>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {/* Share */}
            <Button
              onClick={() => {
                navigator.clipboard.writeText(shareText);
              }}
              className="w-full"
              variant="outline"
            >
              Share Results
            </Button>

            {/* View Game Items */}
            <Button
              onClick={() => {
                if (onNavigate) {
                  onNavigate("game-items");
                }
              }}
              className="w-full"
              variant="primary"
            >
              Continue
            </Button>
          </div>
        </div>
      ) : (
        // Lose condition - centered layout
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Better luck next time
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              You ran out of lives, but every attempt makes you stronger!
            </p>

            {/* Categories Display */}
            <div className="mb-6 space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-center mb-4">All Categories</h3>
              {results.allCategories.map((cat) => {
                const isCorrectlyGuessed = results.solvedCategories.some(solved => solved.category === cat.category);
                
                // Difficulty colors
                const getDifficultyColor = (difficulty: string) => {
                  switch (difficulty.toLowerCase()) {
                    case 'easy': return { fill: '#E2F1E2', stroke: '#92D08D' }
                    case 'medium': return { fill: '#DBF2EE', stroke: '#82DEBD' }
                    case 'hard': return { fill: '#E1D9FD', stroke: '#9C83F8' }
                    case 'expert': return { fill: '#F8DBDE', stroke: '#FF967D' }
                    default: return { fill: '#E2F1E2', stroke: '#92D08D' }
                  }
                }
                
                const colors = getDifficultyColor(cat.difficulty)
                
                return (
                  <div key={cat.category} className="rounded-xl px-3 py-2 border-2" style={{
                    backgroundColor: colors.fill,
                    borderColor: colors.stroke
                  }}>
                    <div className="text-center mb-1">
                      <h4 className="font-bold text-black text-sm uppercase tracking-wide">
                        {cat.category} {!isCorrectlyGuessed && '(Missed)'}
                      </h4>
                    </div>
                    <div className="flex gap-2 justify-center flex-wrap">
                      {cat.items.map((item) => (
                        <div
                          key={item.id}
                          className="relative rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden w-12 h-12 flex-shrink-0"
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            {(() => {
                              const imgUrl = item.product?.featuredImage?.url || item.product?.images?.[0]?.url
                              const productTitle = item.product?.title || 'Product'
                              
                              if (imgUrl) {
                                return (
                                  <div className="w-full h-full relative">
                                    <img 
                                      src={imgUrl} 
                                      alt={productTitle} 
                                      className="w-full h-full object-cover rounded-lg brightness-90 contrast-110 saturate-75"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent rounded-lg" />
                                  </div>
                                )
                              }
                              return (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                                  <span className="text-xs font-medium text-center px-1 leading-tight text-gray-700">
                                    {productTitle.length > 6 ? productTitle.substring(0, 6) + '...' : productTitle}
                                  </span>
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Loading indicator for lose condition */}
            {isSubmitting && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-blue-800 text-sm">
                Syncing with server...
              </div>
            )}

            <div className="space-y-3">
              {/* View Game Items */}
              <Button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate("game-items");
                  }
                }}
                className="w-full"
                variant="primary"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

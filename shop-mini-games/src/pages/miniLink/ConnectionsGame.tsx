import { useEffect, useMemo, useState } from "react";
import { useGenerateGameData } from "../../utils/useGenerateGameData";
import { getLivesImageUrl } from "../../config/imageUrls";
import { Button, Image } from "@shopify/shop-minis-react";

// Add difficulty color palette constant after imports
const DIFFICULTY_COLORS: Record<string, { fill: string; stroke: string }> = {
  easy: { fill: "#E2F1E2", stroke: "#92D08D" },
  medium: { fill: "#DBF2EE", stroke: "#82DEBD" },
  hard: { fill: "#E1D9FD", stroke: "#9C83F8" },
  expert: { fill: "#F8DBDE", stroke: "#FF967D" },
};

interface ConnectionsGameProps {
  onFinish: (results: GameResults) => void;
}

export interface GameResults {
  won: boolean;
  solvedCategories: {
    difficulty: string;
    category: string;
    items: Array<{ id: string; product: any }>;
  }[];
  allCategories: {
    difficulty: string;
    category: string;
    items: Array<{ id: string; product: any }>;
  }[];
  mistakes: number;
  elapsedSeconds: number;
  totalGuesses: number;
}

export default function ConnectionsGame({ onFinish }: ConnectionsGameProps) {
  const { loading, error, categories } = useGenerateGameData();

  // Flattened list of all items with references to their category
  const allItems = useMemo(() => {
    if (loading || error || categories.length === 0) return [];
    return categories.flatMap((cat) =>
      cat.items.map((item) => ({
        ...item,
        categoryKey: cat.category,
        difficulty: cat.difficulty,
      }))
    );
  }, [loading, error, categories]);

  // State for items shown in grid
  const [shuffledItems, setShuffledItems] = useState<typeof allItems>([]);

  // Shuffle items once when they first load to avoid endless re-shuffling
  useEffect(() => {
    if (allItems.length === 16 && shuffledItems.length === 0) {
      const arr = [...allItems];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setShuffledItems(arr);
    }
  }, [allItems, shuffledItems.length]);

  // Gameplay state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [solvedCategories, setSolvedCategories] = useState<
    Array<{ category: string; difficulty: string; items: typeof allItems }>
  >([]);
  const [mistakes, setMistakes] = useState(0);
  const lives = 4;
  const [startTime] = useState(() => Date.now());
  const [totalGuesses, setTotalGuesses] = useState(0);

  // Hint state - track hints available (starts with 1, gets +1 for each solved category)
  const [hintsAvailable, setHintsAvailable] = useState(1);
  const [hintedItems, setHintedItems] = useState<string[]>([]);

  // End game state
  const [showingAnswers, setShowingAnswers] = useState(false);

  // Animation state
  const [animatingIds, setAnimatingIds] = useState<string[]>([]);
  const [animationType, setAnimationType] = useState<
    "error" | "success" | null
  >(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Derived helpers
  const solvedCategoryKeys = solvedCategories.map((cat) => cat.category);
  const remainingLives = lives - mistakes;
  const gameOver = remainingLives === 0 || solvedCategoryKeys.length === 4;
  const won = solvedCategoryKeys.length === 4 && remainingLives >= 0;

  useEffect(() => {
    if (gameOver && !showingAnswers) {
      // Automatically show answers when game ends
      setShowingAnswers(true);
    }
  }, [gameOver, showingAnswers]);

  const handleSeeResults = () => {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    onFinish({
      won,
      solvedCategories: solvedCategories.map((c) => ({
        difficulty: c.difficulty,
        category: c.category,
        items: c.items,
      })),
      allCategories: categories.map((c) => ({
        difficulty: c.difficulty,
        category: c.category,
        items: c.items,
      })),
      mistakes,
      elapsedSeconds,
      totalGuesses,
    });
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "linear-gradient(to bottom, #FAFAFA, #EEEAFF)" }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
            style={{ borderColor: "#4F34E2" }}
          ></div>
          <p className="text-gray-600 font-medium">Loading your game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "linear-gradient(to bottom, #FAFAFA, #EEEAFF)" }}
      >
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-black mb-2">Game Error</h3>
          <p className="text-red-600 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // Handlers
  const toggleSelect = (id: string) => {
    if (gameOver) return;

    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev; // limit 4
      return [...prev, id];
    });
  };

  // Animation functions
  const playErrorAnimation = async (ids: string[]) => {
    setIsAnimating(true);
    setAnimationType("error");

    // Smooth jump animation - one by one with overlap
    for (let i = 0; i < ids.length; i++) {
      setAnimatingIds([ids[i]]);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Brief pause before group shake
    await new Promise((resolve) => setTimeout(resolve, 100));

    // All shake together
    setAnimatingIds(ids);
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Clear animations
    setAnimatingIds([]);
    setAnimationType(null);
    setIsAnimating(false);
  };

  const playSuccessAnimation = async (ids: string[], matchedCategory: any) => {
    setIsAnimating(true);
    setAnimationType("success");

    // Smooth jump animation - one by one with overlap
    for (let i = 0; i < ids.length; i++) {
      setAnimatingIds([ids[i]]);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Brief pause before group celebration
    await new Promise((resolve) => setTimeout(resolve, 100));

    // All celebrate together
    setAnimatingIds(ids);
    await new Promise((resolve) => setTimeout(resolve, 700));

    // Move to solved state - add the solved items with their details
    const solvedItems = shuffledItems.filter((item) => ids.includes(item.id));
    setSolvedCategories((prev) => [
      ...prev,
      {
        category: matchedCategory.category,
        difficulty: matchedCategory.difficulty,
        items: solvedItems,
      },
    ]);

    // Remove from main grid
    setShuffledItems((items) => items.filter((item) => !ids.includes(item.id)));

    // Remove solved items from hinted items list
    setHintedItems((hinted) => hinted.filter((id) => !ids.includes(id)));

    // Add a hint for solving this category (unless it's the last one)
    if (solvedCategories.length < 3) {
      // Will be 4 after this update, so check for < 3
      setHintsAvailable((prev) => prev + 1);
    }

    // Clear animations
    setAnimatingIds([]);
    setAnimationType(null);
    setIsAnimating(false);
  };

  const submitGuess = async () => {
    if (selectedIds.length !== 4 || isAnimating) return;

    // Find if guess matches any unsolved category
    const matchedCategory = categories.find(
      (cat) =>
        !solvedCategoryKeys.includes(cat.category) &&
        selectedIds.every((id) => cat.items.some((item) => item.id === id))
    );

    setTotalGuesses((g) => g + 1);

    if (matchedCategory) {
      // Correct! Play success animation
      await playSuccessAnimation(selectedIds, matchedCategory);
    } else {
      // Incorrect - play error animation
      await playErrorAnimation(selectedIds);
      setMistakes((m) => m + 1);
    }

    // Reset selection
    setSelectedIds([]);
  };

  const useHint = () => {
    if (hintsAvailable <= 0 || gameOver || isAnimating) return;

    // Find an unsolved category that hasn't been hinted yet
    const unsolvedCategories = categories.filter(
      (cat) => !solvedCategoryKeys.includes(cat.category)
    );

    // Find a category where we haven't hinted any items yet
    let targetCategory = null;
    for (const cat of unsolvedCategories) {
      const categoryItemIds = cat.items.map((item) => item.id);
      const alreadyHintedInThisCategory = hintedItems.filter((id) =>
        categoryItemIds.includes(id)
      ).length;

      // Only hint categories that haven't been hinted at all
      if (alreadyHintedInThisCategory === 0) {
        targetCategory = cat;
        break;
      }
    }

    if (!targetCategory) return;

    const categoryItemIds = targetCategory.items.map((item) => item.id);

    // Reveal 3 items from this category
    const itemsToHint = categoryItemIds.slice(0, 3);

    if (itemsToHint.length > 0) {
      setHintedItems((prev) => [...prev, ...itemsToHint]);
      setHintsAvailable((prev) => prev - 1);
    }
  };

  const getItemStatus = (id: string) => {
    if (selectedIds.includes(id)) return "selected";
    const solvedCat = categories.find(
      (cat) =>
        solvedCategoryKeys.includes(cat.category) &&
        cat.items.some((it) => it.id === id)
    );
    if (solvedCat) return "solved";
    if (hintedItems.includes(id)) return "hinted";
    return "default";
  };

  const renderItem = (item: (typeof allItems)[0]) => {
    const status = getItemStatus(item.id);
    const disabled = status === "solved";
    const isAnimatingThis = animatingIds.includes(item.id);

    // Simple minimalist styling to match the design
    const getItemClasses = () => {
      const baseClasses =
        "relative rounded-lg cursor-pointer select-none transition-all duration-200 flex items-center justify-center aspect-square overflow-hidden w-full";

      // Animation classes
      let animationClasses = "";
      if (isAnimatingThis && animationType === "error") {
        if (animatingIds.length === 1) {
          animationClasses = "smooth-bounce";
        } else {
          animationClasses = "shake";
        }
      } else if (isAnimatingThis && animationType === "success") {
        if (animatingIds.length === 1) {
          animationClasses = "smooth-bounce";
        } else {
          animationClasses = "celebrate";
        }
      }

      if (status === "selected") {
        return `${baseClasses} ${animationClasses}`;
      }

      if (status === "solved") {
        return `${baseClasses} bg-gray-200 cursor-default ${animationClasses}`;
      }

      if (status === "hinted") {
        return `${baseClasses} hover:bg-gray-100 ${animationClasses} ring-2 ring-opacity-50`;
      }

      return `${baseClasses} hover:bg-gray-100 ${animationClasses}`;
    };

    return (
      <div
        key={item.id}
        className={getItemClasses()}
        style={status === "hinted" ? { boxShadow: "0 0 0 2px #9C83F8" } : {}}
        onClick={() => (disabled ? null : toggleSelect(item.id))}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {(() => {
            const imgUrl =
              item.product?.featuredImage?.url ||
              item.product?.images?.[0]?.url;
            const productTitle = item.product?.title || "Product";

            if (imgUrl) {
              return (
                <div className="w-full h-full relative">
                  {/* Image with consistent styling */}
                  <Image
                    src={imgUrl}
                    alt={productTitle}
                    className={`w-full h-full object-cover rounded-lg brightness-90 contrast-110 saturate-75 transition-transform duration-200 ${
                      status === "selected" ? "scale-90" : "scale-100"
                    }`}
                  />
                  {/* Subtle gradient overlay for uniformity */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent rounded-lg" />
                  {/* Black/Orange overlay for selected items */}
                  {status === "selected" && (
                    <div
                      className={`absolute inset-0 rounded-lg ${
                        isAnimatingThis &&
                        animationType === "error" &&
                        animatingIds.length > 1
                          ? "bg-black/40"
                          : "bg-black/40"
                      }`}
                      style={
                        isAnimatingThis &&
                        animationType === "error" &&
                        animatingIds.length > 1
                          ? { backgroundColor: "#FF967D", opacity: 0.6 }
                          : {}
                      }
                    />
                  )}
                  {/* Purple tint overlay for hinted items */}
                  {status === "hinted" && (
                    <div
                      className="absolute inset-0 rounded-lg"
                      style={{ backgroundColor: "#9C83F8", opacity: 0.2 }}
                    />
                  )}
                </div>
              );
            }

            // Enhanced fallback for items without images
            return (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                <span className="text-xs font-medium text-center px-2 leading-tight text-gray-700">
                  {productTitle}
                </span>
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Custom animations */}
      <style>{`
        @keyframes smoothBounce {
          0% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-8px) scale(1.02); }
          60% { transform: translateY(-4px) scale(1.01); }
          100% { transform: translateY(0) scale(1); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        
        @keyframes celebrate {
          0% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(2deg); }
          50% { transform: scale(1.15) rotate(-2deg); }
          75% { transform: scale(1.1) rotate(1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        
        @keyframes slideDown {
          0% { 
            transform: translateY(-20px);
            opacity: 0;
          }
          100% { 
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .smooth-bounce {
          animation: smoothBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .shake {
          animation: shake 0.3s ease-in-out infinite;
        }
        
        .celebrate {
          animation: celebrate 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .slide-down {
          animation: slideDown 0.5s ease-out;
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <div
        className="min-h-screen p-4 flex items-center justify-center"
        style={{
          background: "linear-gradient(to bottom, #FAFAFA,rgb(233, 228, 255))",
        }}
      >
        
        <div className="max-w-md w-full">
          {/* Game Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-black mb-2">
              {showingAnswers
                ? won
                  ? "Nice Work!"
                  : "Nice try!"
                : "Can you find any links?"}
            </h1>
            {!showingAnswers && (
              <p className="text-gray-500 text-base">
                Link together groups of 4 items
              </p>
            )}
          </div>

          {/* Categories Display */}
          {(solvedCategories.length > 0 || showingAnswers) && (
            <div className="mb-2 space-y-2">
              {(showingAnswers ? categories : solvedCategories).map((cat) => {
                const categoryItems = showingAnswers ? cat.items : cat.items;

                // Always use difficulty-based colors
                const colors =
                  DIFFICULTY_COLORS[cat.difficulty.toLowerCase()] ||
                  DIFFICULTY_COLORS.easy;

                return (
                  <div
                    key={cat.category}
                    className="rounded-xl px-3 py-2 slide-down border-2"
                    style={{
                      backgroundColor: colors.fill,
                      borderColor: colors.stroke,
                    }}
                  >
                    <div className="text-center mb-1">
                      <h3 className="font-bold text-black text-sm uppercase tracking-wide">
                        {cat.category}
                      </h3>
                    </div>
                    <div className="flex gap-2 justify-center">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className="relative rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden w-16 h-16 flex-shrink-0"
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            {(() => {
                              const imgUrl =
                                item.product?.featuredImage?.url ||
                                item.product?.images?.[0]?.url;
                              const productTitle =
                                item.product?.title || "Product";

                              if (imgUrl) {
                                return (
                                  <div className="w-full h-full relative">
                                    <Image
                                      src={imgUrl}
                                      alt={productTitle}
                                      className="w-full h-full object-cover rounded-lg brightness-90 contrast-110 saturate-75"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent rounded-lg" />
                                  </div>
                                );
                              }
                              return (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                                  <span className="text-xs font-medium text-center px-1 leading-tight text-gray-700">
                                    {productTitle.length > 8
                                      ? productTitle.substring(0, 8) + "..."
                                      : productTitle}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Game Grid - only show when not showing answers */}
          {!showingAnswers && (
            <div className="mb-6">
              <div className="grid grid-cols-4 gap-2">
                {shuffledItems.map(renderItem)}
              </div>
            </div>
          )}

          {/* Action Buttons - only show when not showing answers */}
          {!showingAnswers && (
            <div className="flex gap-3 mb-6">
              <Button
                className={`flex-1 py-3 rounded-full border-2 font-semibold transition-all duration-200 ${
                  hintsAvailable <= 0 || gameOver
                    ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                    : "bg-white transition-colors"
                }`}
                style={
                  hintsAvailable > 0 && !gameOver
                    ? { borderColor: "#4F34E2", color: "#4F34E2" }
                    : {}
                }
                disabled={hintsAvailable <= 0 || gameOver || isAnimating}
                onClick={useHint}
                onMouseEnter={(e) => {
                  if (hintsAvailable > 0 && !gameOver && !isAnimating) {
                    (e.target as HTMLButtonElement).style.backgroundColor =
                      "#F8F6FF";
                  }
                }}
                onMouseLeave={(e) => {
                  if (hintsAvailable > 0 && !gameOver && !isAnimating) {
                    (e.target as HTMLButtonElement).style.backgroundColor =
                      "white";
                  }
                }}
              >
                Hint{hintsAvailable > 1 ? ` (${hintsAvailable})` : ""}
              </Button>
              <Button
                className={`flex-1 py-3 rounded-full font-semibold transition-all duration-200 ${
                  selectedIds.length === 4 && !gameOver && !isAnimating
                    ? "text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                style={
                  selectedIds.length === 4 && !gameOver && !isAnimating
                    ? { backgroundColor: "#4F34E2" }
                    : {}
                }
                disabled={selectedIds.length !== 4 || gameOver || isAnimating}
                onClick={submitGuess}
                onMouseEnter={(e) => {
                  if (selectedIds.length === 4 && !gameOver && !isAnimating) {
                    (e.target as HTMLButtonElement).style.backgroundColor =
                      "#3D26B8";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedIds.length === 4 && !gameOver && !isAnimating) {
                    (e.target as HTMLButtonElement).style.backgroundColor =
                      "#4F34E2";
                  }
                }}
              >
                {gameOver ? "Submit" : "Submit"}
              </Button>
            </div>
          )}

          {/* See Results Button - only show when showing answers */}
          {showingAnswers && (
            <div className="mb-6">
              <Button
                className="w-full py-3 rounded-full font-semibold text-white transition-all duration-200"
                style={{ backgroundColor: "#4F34E2" }}
                onClick={handleSeeResults}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor =
                    "#3D26B8";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor =
                    "#4F34E2";
                }}
              >
                See Results
              </Button>
            </div>
          )}

          {/* Lives Display with Custom Lightning Icons - only show when not showing answers */}
          {!showingAnswers && (
            <div className="text-center">
              <Image
                src={getLivesImageUrl(remainingLives)}
                alt={`${remainingLives} lives remaining`}
                className="h-6 w-auto mx-auto"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

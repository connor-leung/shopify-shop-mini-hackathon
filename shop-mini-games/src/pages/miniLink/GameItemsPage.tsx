import ProductCard from "../../components/ProductCard";
import { GameResults } from "./ConnectionsGame";
import { Button } from "../../components/Button";

// Use the same difficulty color palette as ConnectionsGame
const DIFFICULTY_COLORS: Record<string, { fill: string; stroke: string }> = {
  easy: { fill: "#E2F1E2", stroke: "#92D08D" },
  medium: { fill: "#DBF2EE", stroke: "#82DEBD" },
  hard: { fill: "#E1D9FD", stroke: "#9C83F8" },
  expert: { fill: "#F8DBDE", stroke: "#FF967D" },
};

interface GameItemsPageProps {
  results: GameResults;
  onNavigate: (page: string) => void;
  onBack?: () => void; // Accept onBack prop but don't use it (no back button rendered)
}

export default function GameItemsPage({
  results,
  onNavigate,
  onBack, // Accept but don't use - no back button will be rendered
}: GameItemsPageProps) {
  const { solvedCategories, allCategories, won } = results;

  // Show all categories if the user lost, otherwise show only solved categories
  const categoriesToDisplay = won ? solvedCategories : allCategories;

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "linear-gradient(to bottom, #FAFAFA, #EEEAFF)" }}
    >
      <div className="pt-12 px-4 pb-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Explore</h1>
          <p className="text-gray-600 mb-6">
            {won
              ? "Check out the items from your Mini Link."
              : "Here are all the items and their categories from today's game."}
          </p>
        </div>

        {/* Game Items by Category */}
        <div className="space-y-8 mb-8">
          {categoriesToDisplay.map((category, index) => (
            <div key={`${category.category}-${index}`} className="space-y-4">
              {/* Category Header */}
              <div
                className="p-4 rounded-lg border-l-4"
                style={(() => {
                  const colors = DIFFICULTY_COLORS[category.difficulty.toLowerCase()] || DIFFICULTY_COLORS.easy;
                  return {
                    backgroundColor: colors.fill,
                    borderLeftColor: colors.stroke,
                  };
                })()}
              >
                <h2 className="text-2xl font-bold text-gray-900">
                  {category.category}
                </h2>
                <p
                  className="text-lg font-medium"
                  style={{
                    color: (DIFFICULTY_COLORS[category.difficulty.toLowerCase()] || DIFFICULTY_COLORS.easy).stroke
                  }}
                >
                  {category.difficulty.charAt(0).toUpperCase() + category.difficulty.slice(1)}
                </p>
              </div>

              {/* Product Cards Grid */}
              {category.items && category.items.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {category.items.map((item, itemIndex) => (
                    <div key={`${item.id}-${itemIndex}`} className="w-full">
                      <ProductCard
                        product={item.product}
                        className="h-full"
                        showDescription={true}
                        showVariants={false}
                        hidePricing={false}
                        customActions={false}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No items available for this category</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center pb-20"></div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white shadow-lg z-50 pb-8">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => onNavigate("connections-game")}
              variant="primary"
              size="medium"
              className="w-64"
            >
              Play Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

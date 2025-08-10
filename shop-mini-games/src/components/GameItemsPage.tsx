import ProductCard from "./ProductCard";
import { GameResults } from "./ConnectionsGame";

interface GameItemsPageProps {
  results: GameResults;
  onNavigate: (page: string) => void;
}

export default function GameItemsPage({
  results,
  onNavigate,
}: GameItemsPageProps) {
  const { solvedCategories } = results;

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
            Check out the items from your Mini Link.
          </p>
        </div>

        {/* Game Items by Category */}
        <div className="space-y-8 mb-8">
          {solvedCategories.map((category, index) => (
            <div key={`${category.category}-${index}`} className="space-y-4">
              {/* Category Header */}
              <div
                className={`p-4 rounded-lg border-l-4 ${
                  category.difficulty === "Easy"
                    ? "bg-green-50 border-green-500"
                    : category.difficulty === "Medium"
                    ? "bg-yellow-50 border-yellow-400"
                    : category.difficulty === "Hard"
                    ? "bg-orange-50 border-orange-400"
                    : "bg-red-50 border-red-500"
                }`}
              >
                <h2 className="text-2xl font-bold text-gray-900">
                  {category.category}
                </h2>
                <p
                  className={`text-lg font-medium ${
                    category.difficulty === "Easy"
                      ? "text-green-700"
                      : category.difficulty === "Medium"
                      ? "text-yellow-700"
                      : category.difficulty === "Hard"
                      ? "text-orange-700"
                      : "text-red-700"
                  }`}
                >
                  {/* {category.difficulty} Difficulty */}
                </p>
                {/* <p className="text-gray-600 mt-1">
                  {category.items?.length || 0} products in this category
                </p> */}
              </div>

              {/* Product Cards Grid */}
              {category.items && category.items.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {category.items.map((item, itemIndex) => (
                    <div key={`${item.id}-${itemIndex}`} className="w-full">
                      <ProductCard
                        product={item.product}
                        className="h-full shadow-md hover:shadow-lg transition-shadow"
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
            <button
              onClick={() => onNavigate("connections-results")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ← Back to Results
            </button>
            <button
              onClick={() => onNavigate("connections-game")}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              🎮 Play Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

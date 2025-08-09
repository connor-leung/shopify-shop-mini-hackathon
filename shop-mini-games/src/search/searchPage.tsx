import { useState } from "react";
import { usePopularProducts } from "@shopify/shop-minis-react";
import {
  useProductsByCategory,
  getAvailableCategories,
  getCategoryInfo,
} from "../utils/productSearch";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom";

export function SearchPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customLimit, setCustomLimit] = useState(20);
  const [isSearching, setIsSearching] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { products: popularProducts } = usePopularProducts();

  // Use category search when a category is selected
  const categorySearchResult = useProductsByCategory({
    category: selectedCategory || "shirts", // Default fallback
    limit: customLimit,
  });

  const handleCategorySearch = (category: string, limit?: number) => {
    setSelectedCategory(category);
    if (limit) setCustomLimit(limit);
    setIsSearching(true);
    setCurrentIndex(0); // Reset to first item
  };

  const handleClearSearch = () => {
    setSelectedCategory("");
    setIsSearching(false);
    setCurrentIndex(0);
  };

  // Determine which products to display
  const displayProducts =
    isSearching && selectedCategory
      ? categorySearchResult.products
      : popularProducts;

  const loading = isSearching ? categorySearchResult.loading : false;
  const availableCategories = getAvailableCategories();

  // Navigation functions
  const goToNext = () => {
    if (displayProducts && currentIndex < displayProducts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToFirst = () => {
    setCurrentIndex(0);
  };

  const goToLast = () => {
    if (displayProducts) {
      setCurrentIndex(displayProducts.length - 1);
    }
  };

  // Current product to display
  const currentProduct = displayProducts?.[currentIndex];

  return (
    <div className="pt-12 px-4 pb-6">
      <h1 className="text-2xl font-bold mb-2 text-center">
        Welcome to Shop Minis!
      </h1>
      
      {/* Navigation */}
      <div className="flex justify-center space-x-4 mb-6">
        <Link 
          to="/" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Home
        </Link>
        <Link 
          to="/search" 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Search Products
        </Link>
      </div>

      {/* Category Search Section */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => handleCategorySearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select product category"
          >
            <option value="">Select a category...</option>
            {availableCategories.map((category) => {
              const info = getCategoryInfo(category);
              return (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)} -{" "}
                  {info?.description}
                </option>
              );
            })}
          </select>
          <input
            type="number"
            placeholder="Limit"
            value={customLimit}
            onChange={(e) => setCustomLimit(Number(e.target.value) || 20)}
            className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            max="100"
          />
        </div>

        {/* Quick Category Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategorySearch("shirts", 20)}
            className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
          >
            20 Shirts
          </button>
          <button
            onClick={() => handleCategorySearch("toys", 20)}
            className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
          >
            20 Toys
          </button>
          <button
            onClick={() => handleCategorySearch("shoes", 20)}
            className="px-3 py-1 bg-purple-500 text-white rounded-md text-sm hover:bg-purple-600"
          >
            20 Shoes
          </button>
          <button
            onClick={() => handleCategorySearch("electronics", 15)}
            className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
          >
            15 Electronics
          </button>
          <button
            onClick={() => handleCategorySearch("clothing", 50)}
            className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
          >
            50 Clothing
          </button>
          <button
            onClick={handleClearSearch}
            className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="mb-4">
        {isSearching && selectedCategory ? (
          <div className="text-center">
            <p className="text-base text-gray-600">
              {loading
                ? "Searching..."
                : `${
                    selectedCategory.charAt(0).toUpperCase() +
                    selectedCategory.slice(1)
                  } category (limit: ${customLimit}) - Found: ${
                    categorySearchResult.totalFound
                  } products`}
            </p>
            {categorySearchResult.categoryInfo && (
              <p className="text-sm text-gray-500 mt-1">
                Searching:{" "}
                {categorySearchResult.categoryInfo.searchTerms.join(", ")}
              </p>
            )}
          </div>
        ) : (
          <p className="text-base text-gray-600 text-center">
            These are the popular products today ({popularProducts?.length || 0}{" "}
            products)
          </p>
        )}
      </div>

      {/* Single Product Display with Navigation */}
      {displayProducts && displayProducts.length > 0 && (
        <div className="space-y-4">
          {/* Product Counter */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Product {currentIndex + 1} of {displayProducts.length}
            </p>
          </div>

          {/* Current Product */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm">
              {currentProduct && (
                <ProductCard
                  key={currentProduct.id}
                  product={currentProduct}
                  showDescription={true}
                  showVariants={true}
                  className="enhanced-product-display"
                />
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center space-x-2">
            <button
              onClick={goToFirst}
              disabled={currentIndex === 0}
              className="px-3 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex === displayProducts.length - 1}
              className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={goToLast}
              disabled={currentIndex === displayProducts.length - 1}
              className="px-3 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>

          {/* Quick Jump Buttons */}
          <div className="flex justify-center space-x-1 flex-wrap">
            {displayProducts.slice(0, 10).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-8 h-8 rounded-full text-xs ${
                  currentIndex === index
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {index + 1}
              </button>
            ))}
            {displayProducts.length > 10 && (
              <span className="text-gray-500 text-sm self-center">
                ... +{displayProducts.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {isSearching &&
        selectedCategory &&
        !loading &&
        categorySearchResult.totalFound === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No products found in "{selectedCategory}" category
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Try a different category or check back later
            </p>
          </div>
        )}
    </div>
  );
}

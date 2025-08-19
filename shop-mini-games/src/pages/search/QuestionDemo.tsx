import React, { useState, useEffect } from "react";
import { useProductSearch } from "@shopify/shop-minis-react";
import {
  getRandomQuestionPreview,
  generateQuestionData,
  Difficulty,
} from "../../utils/generateQuestions";

interface QuestionDemoProps {
  onNavigate: (page: string) => void;
}

interface SearchResult {
  term: string;
  products: any[];
  loading: boolean;
  error: any;
  index: number;
}

interface ProductItem {
  id: string;
  product: any;
  searchTerm: string;
  termIndex: number;
}

const QuestionDemo: React.FC<QuestionDemoProps> = ({ onNavigate }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [questionStructures, setQuestionStructures] = useState<any>(null);

  // Generate question structures when component mounts or refreshKey changes
  useEffect(() => {
    try {
      const easyData = generateQuestionData("Easy");
      const mediumData = generateQuestionData("Medium");
      const hardData = generateQuestionData("Hard");
      const expertData = generateQuestionData("Expert");

      // For random, pick one difficulty
      const difficulties: Difficulty[] = ["Easy", "Medium", "Hard", "Expert"];
      const randomDifficulty =
        difficulties[Math.floor(Math.random() * difficulties.length)];
      const randomData = generateQuestionData(randomDifficulty);

      setQuestionStructures({
        easy: easyData,
        medium: mediumData,
        hard: hardData,
        expert: expertData,
        random: randomData,
      });
    } catch (error) {
      console.error("Error generating question structures:", error);
    }
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Show loading state while question structures are being generated
  if (!questionStructures) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-8"></div>
          <div className="h-4 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">
        Question Generation Demo
      </h1>

      {/* Navigation */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => onNavigate("home")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          ← Back to Home
        </button>
      </div>

      {/* Refresh Button */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-4">Generate New Questions</h2>
        <button
          onClick={handleRefresh}
          className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-lg"
        >
          🔄 Generate All Difficulties
        </button>
        <p className="text-gray-600 mt-2">
          This will generate 1 question from each difficulty level
        </p>
      </div>

      {/* Demo Sections - One for each difficulty */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Easy Question */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-green-200">
          <h3 className="text-lg font-semibold mb-4 text-green-600">
            🟢 Easy Difficulty
          </h3>
          <QuestionDisplay
            key={`easy-${refreshKey}`}
            difficulty="Easy"
            questionStructure={questionStructures.easy}
            title="Easy Question"
          />
        </div>

        {/* Medium Question */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-yellow-200">
          <h3 className="text-lg font-semibold mb-4 text-yellow-600">
            🟡 Medium Difficulty
          </h3>
          <QuestionDisplay
            key={`medium-${refreshKey}`}
            difficulty="Medium"
            questionStructure={questionStructures.medium}
            title="Medium Question"
          />
        </div>

        {/* Hard Question */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-orange-200">
          <h3 className="text-lg font-semibold mb-4 text-orange-600">
            🟠 Hard Difficulty
          </h3>
          <QuestionDisplay
            key={`hard-${refreshKey}`}
            difficulty="Hard"
            questionStructure={questionStructures.hard}
            title="Hard Question"
          />
        </div>

        {/* Expert Question */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-red-200">
          <h3 className="text-lg font-semibold mb-4 text-red-600">
            🔴 Expert Difficulty
          </h3>
          <QuestionDisplay
            key={`expert-${refreshKey}`}
            difficulty="Expert"
            questionStructure={questionStructures.expert}
            title="Expert Question"
          />
        </div>
      </div>

      {/* Additional Demo Sections */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Random Question */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-purple-200">
          <h3 className="text-lg font-semibold mb-4 text-purple-600">
            🎲 Random Difficulty Question
          </h3>
          <QuestionDisplay
            key={`random-${refreshKey}`}
            difficulty="Random"
            questionStructure={questionStructures.random}
            title="Random Difficulty"
          />
        </div>

        {/* Question Preview */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-teal-200">
          <h3 className="text-lg font-semibold mb-4 text-teal-600">
            📋 Question Structure Preview
          </h3>
          <QuestionPreview key={`preview-${refreshKey}`} />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">How to Use</h2>
        <ul className="list-disc list-inside space-y-2 text-blue-700">
          <li>
            Click "Generate All Difficulties" to refresh all sections with new
            random questions
          </li>
          <li>
            Each difficulty level (Easy, Medium, Hard, Expert) will show one
            unique question
          </li>
          <li>
            Compare how different difficulties use different search terms and
            categories
          </li>
          <li>
            The "Random" section shows a question with random difficulty for
            comparison
          </li>
          <li>
            The "Preview" section shows question structure without product data
          </li>
          <li>All sections update together when you refresh</li>
        </ul>

        <div className="mt-4 p-4 bg-blue-100 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            How Questions Work:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
            <li>
              <strong>Category:</strong> The theme or pattern that groups the
              search terms together
            </li>
            <li>
              <strong>Search Terms:</strong> Multiple related words that fit the
              category pattern
            </li>
            <li>
              <strong>Primary Search:</strong> We search for the first term to
              show sample products
            </li>
            <li>
              <strong>Product Display:</strong> Shows real products found from
              the search
            </li>
          </ul>
          <p className="text-blue-600 text-sm mt-2">
            <strong>Example:</strong> Category "Starts with 'sh'" has terms:
            shirt, shawl, shoes, shampoo. We search for "shirt" and show
            products that match that pattern.
          </p>
        </div>
      </div>
    </div>
  );
};

// Component to display question data
const QuestionDisplay: React.FC<{
  difficulty: Difficulty | "Random";
  questionStructure: any;
  title: string;
}> = ({ difficulty, questionStructure, title }) => {
  // Search for each search term individually to get one product per term
  const searchResults =
    questionStructure.searchTerms?.map((term: string, index: number) => {
      const { products, loading, error } = useProductSearch({
        query: term,
        first: 1, // Only get 1 product per search term
      });

      return {
        term,
        products,
        loading,
        error,
        index,
      };
    }) || [];

  // Check if any searches are still loading
  const isLoading = searchResults.some((result) => result.loading);

  // Check if any searches have errors
  const hasError = searchResults.some((result) => result.error);
  const firstError = searchResults.find((result) => result.error)?.error;

  // Process the products - one per search term
  const items = searchResults
    .filter(
      (result: SearchResult) => result.products && result.products.length > 0
    )
    .map((result: SearchResult, index: number) => {
      const product = result.products[0]; // Take the first product from each search
      return {
        id: product.id,
        product: product,
        searchTerm: result.term,
        termIndex: result.index,
      };
    });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-red-600 p-3 bg-red-50 rounded">
        Error: {firstError?.message || "Failed to load some questions"}
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-medium text-gray-700 mb-3">{title}</h4>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-600">Difficulty:</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
            {questionStructure.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-600">Category:</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
            {questionStructure.category}
          </span>
        </div>

        <div>
          <span className="font-medium text-gray-600">
            Search Terms & Products:
          </span>
          <div className="text-xs text-gray-500 mb-2">
            Each search term finds exactly 1 product
          </div>
          <div className="space-y-2">
            {questionStructure.searchTerms?.map(
              (term: string, index: number) => {
                const item = items.find(
                  (item: ProductItem) => item.termIndex === index
                );
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                  >
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium min-w-[60px]">
                      {term}
                    </span>
                    <span className="text-gray-500">→</span>
                    {item ? (
                      <div className="flex-1 text-xs">
                        <div className="font-medium">
                          {item.product?.title || "No title"}
                        </div>
                        <div className="text-gray-600">
                          $
                          {item.product?.priceRange?.minVariantPrice?.amount ||
                            "N/A"}
                        </div>
                        <div className="text-gray-500 font-mono text-xs truncate">
                          GID: {item.product?.id || "N/A"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-red-500 text-xs">
                        No product found
                      </span>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>

        <div>
          <span className="font-medium text-gray-600">Summary:</span>
          <div className="text-sm text-gray-500 mt-1">
            {items.length} out of {questionStructure.searchTerms?.length || 0}{" "}
            search terms found products
          </div>
        </div>
      </div>
    </div>
  );
};

// Component to show question preview without products
const QuestionPreview: React.FC = () => {
  const difficulties: Difficulty[] = ["Easy", "Medium", "Hard", "Expert"];
  const randomDifficulty =
    difficulties[Math.floor(Math.random() * difficulties.length)];
  const preview = getRandomQuestionPreview(randomDifficulty);

  return (
    <div>
      <h4 className="font-medium text-gray-700 mb-3">
        Random Question Structure
      </h4>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-600">Difficulty:</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
            {preview.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-600">Category:</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
            {preview.category}
          </span>
        </div>

        <div>
          <span className="font-medium text-gray-600">Search Terms:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {preview.searchTerms.map((term: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {term}
              </span>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-2 p-2 bg-yellow-50 rounded">
          This preview shows the question structure without product data. Use
          the other sections to see actual product results.
        </div>
      </div>
    </div>
  );
};

export default QuestionDemo;

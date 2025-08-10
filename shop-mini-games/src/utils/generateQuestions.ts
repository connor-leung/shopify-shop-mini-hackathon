import { useProductSearch } from "@shopify/shop-minis-react";
import { easy, medium, hard, expert } from "../questions/questions";

export type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";

export interface QuestionData {
  difficulty: Difficulty;
  category: string;
  items: Array<{
    id: string;
    product: any; // Product object from Shopify
  }>;
}

// Helper function to get random item from array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get random product from search results
function getRandomProduct(products: any[]): any | null {
  if (!products || products.length === 0) return null;
  return getRandomItem(products);
}

// Hook to generate a question with products for a specific difficulty
export function useGenerateQuestion(difficulty: Difficulty) {
  let questionPool: any[];
  
  // Select the appropriate difficulty pool
  switch (difficulty) {
    case "Easy":
      questionPool = easy;
      break;
    case "Medium":
      questionPool = medium;
      break;
    case "Hard":
      questionPool = hard;
      break;
    case "Expert":
      questionPool = expert;
      break;
    default:
      throw new Error(`Invalid difficulty: ${difficulty}`);
  }

  // Get random question object
  const randomQuestion = getRandomItem(questionPool);
  const category = Object.keys(randomQuestion)[0];
  const searchTerms = randomQuestion[category];

  // Use the first search term to get products
  const { products, loading, error } = useProductSearch({
    query: searchTerms[0], // Start with first search term
    first: 50, // Get more results to have better random selection
  });

  // Process the products to match the question format
  const items = products ? products.slice(0, searchTerms.length).map((product, index) => ({
    id: product.id,
    product: product
  })) : [];

  return {
    difficulty,
    category,
    items,
    loading,
    error,
    searchTerms
  };
}

// Hook to generate a random question with any difficulty
export function useGenerateRandomQuestion() {
  const difficulties: Difficulty[] = ["Easy", "Medium", "Hard", "Expert"];
  const randomDifficulty = getRandomItem(difficulties);
  return useGenerateQuestion(randomDifficulty);
}

// Enhanced hook that searches for multiple products using different search terms
export function useGenerateQuestionWithMultipleSearches(difficulty: Difficulty) {
  let questionPool: any[];
  
  switch (difficulty) {
    case "Easy":
      questionPool = easy;
      break;
    case "Medium":
      questionPool = medium;
      break;
    case "Hard":
      questionPool = hard;
      break;
    case "Expert":
      questionPool = expert;
      break;
    default:
      throw new Error(`Invalid difficulty: ${difficulty}`);
  }

  const randomQuestion = getRandomItem(questionPool);
  const category = Object.keys(randomQuestion)[0];
  const searchTerms = randomQuestion[category];

  // Search for products using the first search term to get a pool of products
  const { products, loading, error } = useProductSearch({
    query: searchTerms[0],
    first: 100, // Get more results to have better selection
  });

  // Create items array with products that match the search terms
  const items = [];
  if (products && products.length > 0) {
    // For each search term, try to find a product that matches
    for (let i = 0; i < searchTerms.length && i < products.length; i++) {
      const product = products[i];
      if (product) {
        items.push({
          id: product.id,
          product: product
        });
      }
    }
  }

  return {
    difficulty,
    category,
    items,
    loading,
    error,
    searchTerms
  };
}

// Non-hook version for direct function calls (useful for testing or non-React contexts)
export function generateQuestionData(difficulty: Difficulty): {
  difficulty: Difficulty;
  category: string;
  searchTerms: string[];
} {
  let questionPool: any[];
  
  switch (difficulty) {
    case "Easy":
      questionPool = easy;
      break;
    case "Medium":
      questionPool = medium;
      break;
    case "Hard":
      questionPool = hard;
      break;
    case "Expert":
      questionPool = expert;
      break;
    default:
      throw new Error(`Invalid difficulty: ${difficulty}`);
  }

  const randomQuestion = getRandomItem(questionPool);
  const category = Object.keys(randomQuestion)[0];
  const searchTerms = randomQuestion[category];

  return {
    difficulty,
    category,
    searchTerms
  };
}

// Utility function to get available difficulties
export function getAvailableDifficulties(): Difficulty[] {
  return ["Easy", "Medium", "Hard", "Expert"];
}

// Utility function to get random question without products (for planning/preview)
export function getRandomQuestionPreview(difficulty?: Difficulty): {
  difficulty: Difficulty;
  category: string;
  searchTerms: string[];
} {
  const difficulties: Difficulty[] = ["Easy", "Medium", "Hard", "Expert"];
  const selectedDifficulty = difficulty || getRandomItem(difficulties);
  
  return generateQuestionData(selectedDifficulty);
}

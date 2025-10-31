import { useProductSearch } from "@shopify/shop-minis-react";
import { useMemo } from "react";
import { easy, medium, hard, expert } from "../questions/questions";

export type Difficulty = "easy" | "medium" | "hard" | "expert";

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

// Helper function to select unique products by ID
function selectUniqueProducts(products: any[], count: number): any[] {
  if (!products || products.length === 0) return [];
  
  const uniqueProducts: any[] = [];
  const usedIds = new Set<string>();
  const shuffledProducts = [...products].sort(() => Math.random() - 0.5);
  
  for (const product of shuffledProducts) {
    if (!usedIds.has(product.id) && uniqueProducts.length < count) {
      uniqueProducts.push(product);
      usedIds.add(product.id);
    }
  }
  
  return uniqueProducts;
}

// Hook to generate a question with products for a specific difficulty
export function useGenerateQuestion(difficulty: Difficulty, seed?: number) {
  const difficultyPools: Record<Difficulty, any[]> = { easy: easy, medium: medium, hard: hard, expert: expert };

  // Pick a random question only once per component lifecycle to avoid re-randomizing on every render
  const randomQuestion = useMemo(() => getRandomItem(difficultyPools[difficulty]), [difficulty, seed]);
  const category = Object.keys(randomQuestion)[0];
  const searchTerms = randomQuestion[category] as string[];

  // Choose a search term deterministically from the list based on seed to
  // vary queries across retries without increasing concurrent calls.
  const chosenIndex = searchTerms.length > 0 ? Math.abs((seed || 0)) % searchTerms.length : 0;
  const chosenTerm = searchTerms[chosenIndex] || searchTerms[0];

  // Single search to minimize API calls and avoid mid-game rate limits
  const { products, loading, error } = useProductSearch({
    query: chosenTerm,
    first: 30,
  });

  // Process the products to match the question format, ensuring no duplicates
  const items = products ? selectUniqueProducts(products, searchTerms.length).map((product) => ({
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
  const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"];
  const randomDifficulty = getRandomItem(difficulties);
  return useGenerateQuestion(randomDifficulty);
}

// Enhanced hook that searches for multiple products using different search terms
export function useGenerateQuestionWithMultipleSearches(difficulty: Difficulty) {
  const difficultyPools: Record<Difficulty, any[]> = { easy: easy, medium: medium, hard: hard, expert: expert };

  // Memoize chosen question so hooks count stays stable
  const randomQuestion = useMemo(() => getRandomItem(difficultyPools[difficulty]), [difficulty]);
  const category = Object.keys(randomQuestion)[0];
  const searchTerms: string[] = randomQuestion[category] as string[];

  // For each search term perform its own product search
  const results = searchTerms.map((term) =>
    useProductSearch({ query: term, first: 20 })
  );

  const loading = results.some((r) => r.loading);
  const error = results.find((r) => r.error)?.error || null;

  const items: Array<{ id: string; product: any }> = [];
  const usedIds = new Set<string>();
  
  // First, try to get one unique product from each search result
  results.forEach((r) => {
    if (r.products && r.products.length > 0) {
      // Find a product that hasn't been used yet
      const uniqueProduct = r.products.find(product => !usedIds.has(product.id));
      if (uniqueProduct) {
        items.push({ id: uniqueProduct.id, product: uniqueProduct });
        usedIds.add(uniqueProduct.id);
      }
    }
  });

  // If we don't have enough unique products, try to fill from all available products
  if (items.length < searchTerms.length) {
    const allProducts: any[] = [];
    results.forEach(r => {
      if (r.products) {
        allProducts.push(...r.products);
      }
    });
    
    // Get additional unique products
    const additionalProducts = selectUniqueProducts(
      allProducts.filter(product => !usedIds.has(product.id)), 
      searchTerms.length - items.length
    );
    
    additionalProducts.forEach(product => {
      items.push({ id: product.id, product });
    });
  }

  return {
    difficulty,
    category,
    items,
    loading,
    error,
    searchTerms,
  };
}

// Non-hook version for direct function calls (useful for testing or non-React contexts)
export function generateQuestionData(difficulty: Difficulty): {
  difficulty: Difficulty;
  category: string;
  searchTerms: string[];
} {
  const difficultyPools: Record<Difficulty, any[]> = { easy: easy, medium: medium, hard: hard, expert: expert };

  const randomQuestion = getRandomItem(difficultyPools[difficulty]);
  const category = Object.keys(randomQuestion)[0];
  const searchTerms = randomQuestion[category] as string[];

  return {
    difficulty,
    category,
    searchTerms
  };
}

// Utility function to get available difficulties
export function getAvailableDifficulties(): Difficulty[] {
  return ["easy", "medium", "hard", "expert"];
}

// Utility function to get random question without products (for planning/preview)
export function getRandomQuestionPreview(difficulty?: Difficulty): {
  difficulty: Difficulty;
  category: string;
  searchTerms: string[];
} {
  const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"];
  const selectedDifficulty = difficulty || getRandomItem(difficulties);
  
  return generateQuestionData(selectedDifficulty);
}

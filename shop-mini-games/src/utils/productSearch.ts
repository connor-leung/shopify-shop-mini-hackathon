import { useProductSearch } from "@shopify/shop-minis-react";

export const NUMBER_OF_ITEMS = 10;

export interface ProductSearchOptions {
  category: string;
  limit?: number;
  includeVariants?: string[];
}

export interface CategoryConfig {
  searchTerms: string[];
  maxResults: number;
  description: string;
}

// Predefined category configurations
export const PRODUCT_CATEGORIES: Record<string, CategoryConfig> = {
  shirts: {
    searchTerms: ["shirt", "t-shirt", "tee", "blouse", "top"],
    maxResults: NUMBER_OF_ITEMS,
    description: "All types of shirts and tops",
  },
  toys: {
    searchTerms: ["toy", "game", "puzzle", "doll", "action figure", "plush"],
    maxResults: NUMBER_OF_ITEMS,
    description: "Toys and games for all ages",
  },
  shoes: {
    searchTerms: ["shoe", "sneaker", "boot", "sandal", "heel", "footwea1r"],
    maxResults: NUMBER_OF_ITEMS,
    description: "All types of footwear",
  },
  accessories: {
    searchTerms: [
      "accessory",
      "jewelry",
      "watch",
      "bag",
      "hat",
      "belt",
      "scarf",
    ],
    maxResults: NUMBER_OF_ITEMS,
    description: "Fashion accessories and jewelry",
  },
  electronics: {
    searchTerms: [
      "electronic",
      "phone",
      "laptop",
      "tablet",
      "headphone",
      "speaker",
    ],
    maxResults: NUMBER_OF_ITEMS,
    description: "Electronic devices and gadgets",
  },
  clothing: {
    searchTerms: ["clothing", "apparel", "dress", "pants", "jacket", "sweater"],
    maxResults: NUMBER_OF_ITEMS,
    description: "All types of clothing and apparel",
  },
};

// Hook for searching products by category
export function useProductsByCategory(options: ProductSearchOptions) {
  const { category, limit } = options;
  const categoryConfig = PRODUCT_CATEGORIES[category.toLowerCase()];

  if (!categoryConfig) {
    throw new Error(
      `Unknown category: ${category}. Available categories: ${Object.keys(
        PRODUCT_CATEGORIES
      ).join(", ")}`
    );
  }

  // Use the first search term as primary, but we could enhance this to search multiple terms
  const primarySearchTerm = categoryConfig.searchTerms[0];
  const searchLimit = limit || categoryConfig.maxResults;

  const { products, loading, error } = useProductSearch({
    query: primarySearchTerm,
    first: searchLimit,
  });

  return {
    products,
    loading,
    error,
    categoryInfo: categoryConfig,
    searchTerm: primarySearchTerm,
    totalFound: products?.length || 0,
  };
}

// Utility function to get all available categories
export function getAvailableCategories(): string[] {
  return Object.keys(PRODUCT_CATEGORIES);
}

// Utility function to get category info
export function getCategoryInfo(category: string): CategoryConfig | null {
  return PRODUCT_CATEGORIES[category.toLowerCase()] || null;
}

// Utility function to search multiple categories (for advanced use)
export function getMultipleCategorySearchTerms(categories: string[]): string[] {
  const allTerms: string[] = [];

  categories.forEach((category) => {
    const config = PRODUCT_CATEGORIES[category.toLowerCase()];
    if (config) {
      allTerms.push(...config.searchTerms);
    }
  });

  return [...new Set(allTerms)]; // Remove duplicates
}

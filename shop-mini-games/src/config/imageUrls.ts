// Image URLs configuration - Shopify CDN only
export const IMAGE_URLS = {
  // Logo - Use your uploaded icon from Shopify CDN
  logo: "https://cdn.shopify.com/s/files/1/0718/0402/7051/files/icon.png?v=1758084484",

  // Lives remaining images - Shopify CDN URLs
  lives: {
    0: "https://cdn.shopify.com/s/files/1/0718/0402/7051/files/Property-1-0.png?v=1758084521",
    1: "https://cdn.shopify.com/s/files/1/0718/0402/7051/files/Property-1-1.png?v=1758084521",
    2: "https://cdn.shopify.com/s/files/1/0718/0402/7051/files/Property-1-2.png?v=1758084521",
    3: "https://cdn.shopify.com/s/files/1/0718/0402/7051/files/Property-1-3.png?v=1758084521",
    4: "https://cdn.shopify.com/s/files/1/0718/0402/7051/files/Property-1-4.png?v=1758084521",
  }
} as const;

// Helper function to get lives image URL
export function getLivesImageUrl(livesRemaining: number): string {
  const clampedLives = Math.max(0, Math.min(4, livesRemaining)) as keyof typeof IMAGE_URLS.lives;
  return IMAGE_URLS.lives[clampedLives];
}

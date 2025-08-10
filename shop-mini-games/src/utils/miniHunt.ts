// src/utils/miniHunt.ts
// Minimal utilities to build a product graph and check if a path exists within K jumps.
// Works per store using the Shopify Storefront API from inside a Shop Mini.

export const API_VERSION = "2025-07";

/** Basic product node used for traversal */
export type ProductNode = {
  id: string;
  handle: string;
  title: string;
};

/** Generic GraphQL fetch helper (client-side; token optional for tokenless reads) */
export async function gql<T>(
  shopDomain: string,
  query: string,
  variables: Record<string, any>,
  token?: string
): Promise<T> {
  const r = await fetch(
    `https://${shopDomain}/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Shopify-Storefront-Access-Token": token } : {}),
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data as T;
}

/** Seed query: recs (RELATED/COMPLEMENTARY), product.category, and a few co-collection peers */
const SEED = `#graphql
query Seed($handle: String!, $perCol: Int = 8) {
  product(handle: $handle) {
    id handle title vendor
    category { id name }
    collections(first: 3) {
      nodes {
        handle
        products(first: $perCol) {
          nodes { id handle title }
        }
      }
    }
  }
  related: productRecommendations(productHandle: $handle, intent: RELATED) {
    id handle title
  }
  comp: productRecommendations(productHandle: $handle, intent: COMPLEMENTARY) {
    id handle title
  }
}`;

/** Category peers via Storefront search + productFilters.category */
const CATEGORY_PEERS = `#graphql
query CategoryPeers($categoryId: String!, $first: Int = 12, $after: String) {
  search(
    query: "",
    types: [PRODUCT],
    productFilters: [{ category: { id: $categoryId } }],
    first: $first,
    after: $after
  ) {
    edges { node { ... on Product { id handle title } } }
    pageInfo { hasNextPage endCursor }
  }
}`;

/** In-memory neighbor cache (per session). You can add device storage if you want persistence. */
const neighborCache = new Map<string, ProductNode[]>();
/**
 * Build neighbors for a product handle using:
 *  - productRecommendations (RELATED + COMPLEMENTARY)
 *  - co-collection peers (a few collections)
 *  - same-category peers (first page)
 *
 * Returns up to `limit` unique neighbors (de-duped by product id and excluding self).
 */
export async function neighbors(
  shopDomain: string,
  handle: string,
  token?: string,
  limit = 20
): Promise<ProductNode[]> {
  const cacheKey = `${shopDomain}:${handle}:${limit}`;
  const hit = neighborCache.get(cacheKey);
  if (hit) return hit;

  // 1) Seed
  type SeedResp = {
    product: {
      id: string;
      handle: string;
      title: string;
      category?: { id: string; name: string } | null;
      collections: { nodes: { products: { nodes: ProductNode[] } }[] };
    } | null;
    related: ProductNode[];
    comp: ProductNode[];
  };

  let seed: SeedResp;
  try {
    seed = await gql<SeedResp>(shopDomain, SEED, { handle }, token);
  } catch {
    return [];
  }

  if (!seed.product) return [];

  const peers: ProductNode[] = [];

  // Recommendations first (usually strongest signal)
  if (Array.isArray(seed.related)) peers.push(...seed.related);
  if (Array.isArray(seed.comp)) peers.push(...seed.comp);

  // Co-collection peers
  for (const c of seed.product.collections.nodes) {
    if (c?.products?.nodes) peers.push(...c.products.nodes);
  }

  // 2) Same-category peers (first page only for budget control)
  const catId = seed.product.category?.id;
  if (catId) {
    type CatResp = {
      search: {
        edges: { node: ProductNode }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    };

    try {
      const cat = await gql<CatResp>(
        shopDomain,
        CATEGORY_PEERS,
        { categoryId: catId, first: 12 },
        token
      );
      peers.push(...cat.search.edges.map((e) => e.node));
    } catch {
      /* ignore category errors for resilience */
    }
  }

  // De-dupe by id and drop self; enforce limit
  const selfHandle = seed.product.handle;
  const seen = new Set<string>();
  const out: ProductNode[] = [];

  for (const p of peers) {
    if (!p) continue;
    if (p.handle === selfHandle) continue;
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= limit) break;
  }

  neighborCache.set(cacheKey, out);
  return out;
}
/** Result for path existence / reconstruction */
export type PathResult = { exists: boolean; path: string[] }; // handles from start → goal

/**
 * Depth-limited DFS (DLS): can we reach goal from cur within `depth`?
 * - Returns the first found path (not guaranteed shortest unless used with iterative deepening).
 * - `budget.nodes` caps total node expansions to guard API usage.
 */
export async function dfsLimited(
  shopDomain: string,
  curHandle: string,
  goalHandle: string,
  depth: number,
  token?: string,
  path: string[] = [],
  budget: { nodes: number } = { nodes: 300 }
): Promise<PathResult> {
  if (curHandle === goalHandle)
    return { exists: true, path: [...path, curHandle] };
  if (depth === 0 || budget.nodes <= 0) return { exists: false, path };

  budget.nodes--;

  // Neighbors ordered by signal strength (recs → co-collection → same-category)
  const nbrs = await neighbors(shopDomain, curHandle, token);

  // Tiny heuristic: if the goal is among neighbors, check it first.
  const idx = nbrs.findIndex((n) => n.handle === goalHandle);
  if (idx >= 0) {
    const n = nbrs[idx];
    const res = await dfsLimited(
      shopDomain,
      n.handle,
      goalHandle,
      depth - 1,
      token,
      [...path, curHandle],
      budget
    );
    if (res.exists) return res;
  }

  // Explore others
  for (let i = 0; i < nbrs.length; i++) {
    const n = nbrs[i];
    if (n.handle === goalHandle || path.includes(n.handle)) continue;
    const res = await dfsLimited(
      shopDomain,
      n.handle,
      goalHandle,
      depth - 1,
      token,
      [...path, curHandle],
      budget
    );
    if (res.exists) return res;
  }

  return { exists: false, path };
}

/**
 * Iterative Deepening DFS (IDDFS):
 * Tries depth = 1..maxJumps. If a path exists within K jumps, returns the first found path.
 * The first path found by IDDFS is also a shortest path (in number of jumps).
 */
export async function existsWithinJumps(
  shopDomain: string,
  startHandle: string,
  goalHandle: string,
  maxJumps: number,
  token?: string,
  perDepthBudget: number = 300
): Promise<PathResult> {
  if (startHandle === goalHandle) return { exists: true, path: [startHandle] };

  for (let d = 1; d <= maxJumps; d++) {
    const r = await dfsLimited(
      shopDomain,
      startHandle,
      goalHandle,
      d,
      token,
      [],
      { nodes: perDepthBudget }
    );
    if (r.exists) return r;
  }

  return { exists: false, path: [] };
}

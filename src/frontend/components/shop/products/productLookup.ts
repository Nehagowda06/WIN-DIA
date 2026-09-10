import { comboOffer, everydayProducts, glutenFreeProducts } from "@/src/frontend/data/products";

import { toRouteId, type Product, type ProductTheme } from "./productShared";

// One "entry" pairs a product with its theme and route id
type Entry = { readonly theme: ProductTheme; readonly product: Product; readonly routeId: string };

/**
 * Flattens all product collections into entries.
 * All products are now displayed with theme="everyday" on the shop page.
 */
function allEntries(): readonly Entry[] {
  // Combine all flavour products - they're all displayed with theme="everyday" now
  const allFlavourProducts = [...glutenFreeProducts, ...everydayProducts];
  
  const collections: { theme: ProductTheme; products: readonly Product[] }[] = [
    { theme: "everyday", products: allFlavourProducts },
    { theme: "combo", products: [comboOffer] },
  ];

  return collections.flatMap(({ theme, products }) =>
    products.map((product) => ({ theme, product, routeId: toRouteId(theme, product) }))
  );
}

/**
 * Finds a product by its /product/[id] route id.
 * Used by ProductDetail.tsx to turn the URL param into an actual product.
 * Returns null if nothing matches (shown as a "not found" state).
 */
export function findProductByRouteId(routeId: string): { product: Product; theme: ProductTheme } | null {
  const match = allEntries().find((entry) => entry.routeId === routeId);
  return match ? { product: match.product, theme: match.theme } : null;
}

/**
 * Picks other products to show as "You might also like" on the detail page.
 * Excludes the product currently being viewed.
 */
export function getRecommendations(excludeRouteId: string, theme: ProductTheme, count = 4): readonly Entry[] {
  const others = allEntries().filter((entry) => entry.routeId !== excludeRouteId);
  const sameRange = others.filter((entry) => entry.theme === theme);
  const rest = others.filter((entry) => entry.theme !== theme);
  return [...sameRange, ...rest].slice(0, count);
}
import { everydayProducts } from "@/src/frontend/data/products";

import { ProductRange } from "./GlutenFree";

/** Everyday product range displayed on the shop landing page. */
export function Everyday() {
  return (
    <ProductRange
      heading="The Everyday Range"
      headingId="everyday-heading"
      products={everydayProducts}
      theme="everyday"
    />
  );
}

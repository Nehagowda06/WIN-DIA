import { everydayProducts } from "@/src/frontend/data/products";

import { ProductRange } from "./GlutenFree";

type Product = Parameters<typeof ProductRange>[0]["products"][number];

/** Everyday product range displayed on the shop landing page. */
export function Everyday({ products }: { products?: readonly Product[] }) {
  const data = products?.length ? products : everydayProducts;
  return (
    <ProductRange
      heading="The Everyday Range"
      headingId="everyday-heading"
      products={data}
      theme="everyday"
    />
  );
}

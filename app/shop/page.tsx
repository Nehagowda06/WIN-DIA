import { Hero } from "@/src/frontend/components/shop/Hero";
import { Everyday } from "@/src/frontend/components/shop/products/Everyday";
import { GlutenFree } from "@/src/frontend/components/shop/products/GlutenFree";

export default function ShopPage() {
  return (
    <main>
      <Hero />
      <GlutenFree />
      <Everyday />
    </main>
  );
}

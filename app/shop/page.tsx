import { Catalogue } from "@/src/frontend/components/shop/Catalogue";
import Footer from "@/src/frontend/components/Footer";
import { Hero, Navbar } from "@/src/frontend/components/shop/Hero";
import { Everyday } from "@/src/frontend/components/shop/products/Everyday";
import { GlutenFree } from "@/src/frontend/components/shop/products/GlutenFree";

export default function ShopPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Catalogue />
        <GlutenFree />
        <Everyday />
      </main>
      <Footer />
    </>
  );
}

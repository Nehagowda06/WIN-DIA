import StoreNav from "@/src/frontend/components/StoreNav";
import ProductGrid from "@/src/frontend/components/ProductGrid";
import { localProducts } from "@/src/frontend/data/products";
import styles from "../storefront.module.css";

export default function ShopPage() {
  return (
    <main className={styles.shell}>
      <StoreNav />
      <section className={styles.section}>
        <div className={styles.sectionTop}>
          <div>
            <h2>Shop WIN-DIA</h2>
            <p className={styles.muted}>Add products to cart, save favourites, and checkout with Razorpay or COD.</p>
          </div>
        </div>
        <ProductGrid initialProducts={localProducts} />
      </section>
    </main>
  );
}

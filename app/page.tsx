import Link from "next/link";
import StoreNav from "@/src/frontend/components/StoreNav";
import ProductGrid from "@/src/frontend/components/ProductGrid";
import { localProducts } from "@/src/frontend/data/products";
import styles from "./storefront.module.css";

export default function Home() {
  return (
    <main className={styles.shell}>
      <StoreNav />
      <section className={styles.hero}>
        <div>
          <h1>The divine healthy crunch.</h1>
          <p className={styles.lead}>
            Premium khakhra snacks made for everyday cravings, gifting, office breaks, and guilt-light late night hunger.
          </p>
          <div className={styles.actions}>
            <Link href="/shop" className={styles.goldBtn}>Shop Khakhra</Link>
            <Link href="/register" className={styles.ghost}>Create Account</Link>
          </div>
        </div>
        <div className={styles.heroImage}>
          <img src="/images/hero-bg.png" alt="WIN-DIA khakhra collection" />
        </div>
      </section>

      <section className={styles.band}>
        <div className={styles.section}>
          <div className={styles.sectionTop}>
            <div>
              <h2>Best Sellers</h2>
              <p className={styles.muted}>Start with the flavours customers ask for most.</p>
            </div>
            <Link href="/shop" className={styles.ghost}>View all</Link>
          </div>
          <ProductGrid initialProducts={localProducts.slice(0, 4)} />
        </div>
      </section>
    </main>
  );
}

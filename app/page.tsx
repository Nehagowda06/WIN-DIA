import Link from "next/link";
import StoreNav from "@/src/frontend/components/StoreNav";
import Footer from "@/src/frontend/components/Footer";
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

      <section id="health-benefits" className={styles.section}>
        <div className={styles.sectionTop}>
          <div>
            <h2>Health Benefits</h2>
            <p className={styles.muted}>Baked thins made for lighter everyday snacking.</p>
          </div>
        </div>
        <div className={styles.accountGrid}>
          <div className={styles.panel}>
            <h3>Fibre Rich</h3>
            <p className={styles.muted}>Crafted for a satisfying crunch without feeling heavy.</p>
          </div>
          <div className={styles.panel}>
            <h3>Gluten-Free Options</h3>
            <p className={styles.muted}>Shop dedicated gluten-free flavours from the WIN-DIA thins range.</p>
          </div>
          <div className={styles.panel}>
            <h3>Everyday Friendly</h3>
            <p className={styles.muted}>Portionable packs for tea time, office breaks, and travel snacking.</p>
          </div>
        </div>
      </section>

      <section id="our-story" className={styles.band}>
        <div className={styles.section}>
          <div className={styles.sectionTop}>
            <div>
              <h2>Our Story</h2>
              <p className={styles.muted}>WIN-DIA brings familiar Indian flavours into a cleaner, modern snack format.</p>
            </div>
            <Link href="/shop" className={styles.ghost}>Explore products</Link>
          </div>
          <div className={styles.panel}>
            <p className={styles.lead}>
              We focus on crisp textures, balanced flavours, and ingredients that fit real daily routines.
              Pick a flavour, save your favourites, add to cart, and complete checkout securely.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

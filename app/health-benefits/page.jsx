import Link from "next/link";
import StoreNav from "@/src/frontend/components/StoreNav";
import Footer from "@/src/frontend/components/Footer";
import styles from "@/app/storefront.module.css";

const benefits = [
  ["Baked crunch", "A crisp snack format made for lighter daily cravings."],
  ["Fibre focused", "Designed to feel satisfying in small, shareable portions."],
  ["No heavy snacking", "Easy to pair with tea, dips, salads, and office breaks."],
  ["Gluten-free range", "Dedicated thins are available for gluten-free snacking needs."],
  ["Indian flavours", "Garlic, curry leaf, moringa, methi, and more familiar profiles."],
  ["Travel friendly", "Shelf-stable packs that fit bags, desks, and gifting baskets."],
];

export const metadata = {
  title: "Health Benefits | WIN-DIA",
  description: "Why WIN-DIA khakhra and thins make a lighter everyday snack.",
};

export default function HealthBenefitsPage() {
  return (
    <main className={styles.shell}>
      <StoreNav />
      <section className={styles.hero}>
        <div>
          <h1>Healthy snacking should still taste joyful.</h1>
          <p className={styles.lead}>
            WIN-DIA thins and khakhra bring crisp Indian flavour into a cleaner,
            portion-friendly snack you can enjoy across the day.
          </p>
          <div className={styles.actions}>
            <Link href="/shop" className={styles.goldBtn}>Shop healthy snacks</Link>
            <Link href="/our-story" className={styles.ghost}>Read our story</Link>
          </div>
        </div>
        <div className={styles.heroImage}>
          <img src="/images/hero-bg.png" alt="WIN-DIA khakhra healthy snack range" />
        </div>
      </section>

      <section className={styles.band}>
        <div className={styles.section}>
          <div className={styles.sectionTop}>
            <div>
              <h2>Why customers choose it</h2>
              <p className={styles.muted}>Simple benefits that match real snack habits.</p>
            </div>
          </div>
          <div className={styles.benefitGrid}>
            {benefits.map(([title, copy]) => (
              <article key={title} className={styles.panel}>
                <h3>{title}</h3>
                <p className={styles.muted}>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTop}>
          <div>
            <h2>Pair it your way</h2>
            <p className={styles.muted}>A few easy ways to make WIN-DIA part of the day.</p>
          </div>
          <Link href="/shop" className={styles.ghost}>Explore products</Link>
        </div>
        <div className={styles.storyGrid}>
          <article className={styles.panel}>
            <h3>Tea-time crunch</h3>
            <p className={styles.muted}>Serve plain or with a light chutney dip.</p>
          </article>
          <article className={styles.panel}>
            <h3>Office snack box</h3>
            <p className={styles.muted}>Keep packs ready for mid-day hunger.</p>
          </article>
          <article className={styles.panel}>
            <h3>Family sharing</h3>
            <p className={styles.muted}>Mix flavours for guests, gifting, or movie nights.</p>
          </article>
        </div>
      </section>
      <Footer />
    </main>
  );
}

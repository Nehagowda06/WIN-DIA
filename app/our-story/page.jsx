import Link from "next/link";
import StoreNav from "@/src/frontend/components/StoreNav";
import Footer from "@/src/frontend/components/Footer";
import styles from "@/app/storefront.module.css";

const values = [
  ["Indian roots", "Familiar flavours shaped for modern snack routines."],
  ["Better ingredients", "Baked crunch, balanced spices, and simple everyday packs."],
  ["Made to share", "A snack that fits tea time, travel, office breaks, and gifting."],
];

export const metadata = {
  title: "Our Story | WIN-DIA",
  description: "The story behind WIN-DIA khakhra and healthy Indian snacking.",
};

export default function OurStoryPage() {
  return (
    <main className={styles.shell}>
      <StoreNav />
      <section className={`${styles.hero} ${styles.storyHero}`}>
        <div>
          <h1>Our story begins with a better crunch.</h1>
          <p className={styles.lead}>
            WIN-DIA was built around a simple idea: Indian snacks can feel
            familiar, premium, and lighter without losing the joy of flavour.
          </p>
          <div className={styles.actions}>
            <Link href="/shop" className={styles.goldBtn}>Shop flavours</Link>
            <Link href="/health-benefits" className={styles.ghost}>Why it is better</Link>
          </div>
        </div>
        <div className={styles.heroImage}>
          <img src="/images/founder.png" alt="WIN-DIA founder and snack story" />
        </div>
      </section>

      <section className={styles.band}>
        <div className={styles.section}>
          <div className={styles.sectionTop}>
            <div>
              <h2>What WIN-DIA stands for</h2>
              <p className={styles.muted}>Clean everyday snacking with Indian comfort at the centre.</p>
            </div>
          </div>
          <div className={styles.storyGrid}>
            {values.map(([title, copy]) => (
              <article key={title} className={styles.panel}>
                <h3>{title}</h3>
                <p className={styles.muted}>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.storySplit}>
          <div>
            <h2>From homestyle taste to a real online store</h2>
            <p className={styles.lead}>
              Every page of this website now supports the real workflow:
              customers can sign in, browse products, save favourites, add to
              cart, add delivery addresses, and place orders securely.
            </p>
          </div>
          <div className={styles.panel}>
            <h3>Built for the next step</h3>
            <p className={styles.muted}>
              The admin dashboard and Supabase tables give the team a base to
              track orders, products, users, and payment status as the project
              moves from testing to live polish.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

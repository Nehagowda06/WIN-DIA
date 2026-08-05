import { HeroContent } from "./HeroContent";
import styles from "./Hero.module.scss";

/**
 * Full-viewport introduction for the shop experience.
 *
 * The media URLs are kept at the boundary of the component so they can later
 * be replaced by Supabase Storage URLs without changing the child components.
 */
export function Hero() {
  return (
    <section
      className={styles.hero}
      aria-labelledby="shop-hero-heading"
      data-navbar-theme="brown"
    >
      <video
        className={styles.video}
        autoPlay
        muted
        playsInline
        poster="/images/hero/hero-poster.jpeg"
        preload="metadata"
        aria-hidden="true"
      >
         <source src="/video/hero_vdo.mp4" type="video/mp4" />
      </video>
      <div className={styles.overlay} aria-hidden="true" />

      <HeroContent
        heading={
          <>
            100% Natural
            <br />
            GI &lt; 44
          </>
        }
        headingId="shop-hero-heading"
        ctaHref="/shop"
        ctaLabel="shop here"
      />
    </section>
  );
}

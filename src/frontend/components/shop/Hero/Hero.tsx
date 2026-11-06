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
        loop
        playsInline
        poster="/images/hero/hero-poster.jpeg"
        preload="auto"
        aria-hidden="true"
      >
        <source src="/video/shop-hero_vdo.mp4" type="video/mp4" />
      </video>
      <div className={styles.overlay} aria-hidden="true" />

      <HeroContent
        heading={
          <>
            Shop WIN-DIA
            <br />
            FibreRich Thins
          </>
        }
        headingId="shop-hero-heading"
      />
    </section>
  );
}
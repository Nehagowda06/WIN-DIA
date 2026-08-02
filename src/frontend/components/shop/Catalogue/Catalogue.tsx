import Image from "next/image";

import { catalogueItems } from "@/src/frontend/data/catalogue";

import styles from "./Catalogue.module.scss";

/** Full-viewport category overview for the shop. */
export function Catalogue() {
  return (
    <section
      className={styles.section}
      aria-labelledby="catalogue-heading"
      data-navbar-theme="off-white"
    >
      <div className={styles.headingArea}>
        <h2 id="catalogue-heading" className={styles.heading}>
          Catalogue
        </h2>
      </div>

      <div className={styles.cards}>
        {catalogueItems.map((item) => (
          <article key={item.id} className={styles.card}>
            <Image
              className={styles.image}
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 100vw, 33.333vw"
            />
            <h3 className={styles.label}>{item.name}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}

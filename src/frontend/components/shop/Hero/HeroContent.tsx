"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

import { HeroButton } from "./HeroButton";
import styles from "./HeroContent.module.scss";

type HeroContentProps = {
  readonly heading: ReactNode;
  readonly headingId: string;
  readonly ctaHref: string;
  readonly ctaLabel: string;
};

/** Centrally aligned messaging and action for the shop hero. */
export function HeroContent({
  heading,
  headingId,
  ctaHref,
  ctaLabel,
}: HeroContentProps) {
  const prefersReducedMotion = useReducedMotion();

  const contentAnimation: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      className={styles.content}
      initial="hidden"
      animate="visible"
      variants={contentAnimation}
    >
      <motion.h1
        id={headingId}
        className={styles.heading}
        variants={contentAnimation}
        transition={{ delay: 0.08 }}
      >
        {heading}
      </motion.h1>
      <motion.div
        className={styles.action}
        variants={contentAnimation}
        transition={{ delay: 0.2 }}
      >
        <HeroButton href={ctaHref}>{ctaLabel}</HeroButton>
      </motion.div>
    </motion.div>
  );
}

"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import styles from "./HeroButton.module.scss";

type HeroButtonProps = {
  readonly href: string;
  readonly children: ReactNode;
};

/** A reusable hero call-to-action rendered as a semantic link. */
export function HeroButton({ href, children }: HeroButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={styles.motionWrapper}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.035, y: -1 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 360, damping: 24 }}
    >
      <Link className={styles.button} href={href}>
        {children}
      </Link>
    </motion.div>
  );
}

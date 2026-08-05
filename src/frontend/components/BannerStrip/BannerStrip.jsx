"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import "./BannerStrip.css";

export default function BannerStrip({ position = "homepage" }) {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch(`/api/banners?position=${position}`)
      .then((r) => r.json())
      .then((d) => d.success && setBanners(d.banners))
      .catch(() => {});
  }, [position]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[current];
  const content = (
    <motion.div
      key={banner.id}
      className="bannerStripImageWrap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <img src={banner.image_url} alt={banner.title} className="bannerStripImage" />
    </motion.div>
  );

  return (
    <section className="bannerStripRoot">
      <div className="bannerStripInner">
        <AnimatePresence mode="wait">
          {banner.link_url ? <Link href={banner.link_url}>{content}</Link> : content}
        </AnimatePresence>
        {banners.length > 1 && (
          <div className="bannerStripDots">
            {banners.map((_, i) => (
              <button
                key={i}
                className={`bannerStripDot ${i === current ? "active" : ""}`}
                onClick={() => setCurrent(i)}
                aria-label={`Show banner ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import "./BannerStrip.css";

export default function BannerStrip({ position = "homepage" }) {
  return (
    <section className="bannerStripRoot">
      <div className="bannerStripInner">
        <div className="bannerStripContent">
          {position === "homepage" ? (
            <>
              <div className="bannerStripTrack">
  <div className="bannerStripContent">
    <span>✦ FREE SHIPPING ON ORDERS ABOVE ₹499</span>
    <span>•</span>
    <span>EXPLORE ALL 6 FLAVOURS</span>
    <span>•</span>
    <Link href="/shop">SHOP NOW →</Link>

    {/* Duplicate for seamless scrolling */}
    <span>✦ FREE SHIPPING ON EVERY ORDER</span>
    <span>•</span>
    <span>EXPLORE ALL 6 FLAVOURS</span>
    <span>•</span>
    <Link href="/shop">SHOP NOW →</Link>

   

     {/* Duplicate for seamless scrolling */}
    <span>✦ FREE SHIPPING ON EVERY ORDER</span>
    <span>•</span>
    <span>EXPLORE ALL 6 FLAVOURS</span>
    <span>•</span>
    <Link href="/shop">SHOP NOW →</Link>
  </div>
</div>
            </>
          ) : (
            <>
              <span>✦ FREE SHIPPING ON EVERY ORDER</span>
              <span>•</span>
              <span>EXPLORE ALL 6 FLAVOURS</span>
              <span>•</span>
              <Link href="/shop">SHOP NOW →</Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
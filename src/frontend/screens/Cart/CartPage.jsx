"use client";
import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiArrowRight,
  FiArrowLeft, FiTruck, FiShield, FiHeart, FiPackage, FiTag
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  removeFromCart, updateQuantity, addToCart,
  setPromoApplied as setPromoAppliedAction, setPromoCode as setPromoCodeAction,
  getCartItemKey, MAX_BUNDLES_PER_ITEM,
} from "@/src/frontend/redux/slices/cartSlice";
import { flavorLabel } from "@/src/frontend/lib/comboFlavors";
import { calculateOrderBundlePricing } from "@/src/frontend/lib/pricing";
import { addToWishlist } from "@/src/frontend/redux/slices/wishlistSlice";
import styles from "./CartPage.module.css";
import { handleQty as handleQtyHelper } from "./cartHelpers";

const FREE_THRESHOLD = 0; // Free delivery always — no threshold needed

export default function CartPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { cartItems, promoApplied, promoCode } = useSelector((s) => s.cart);
  const { wishlistItems } = useSelector((s) => s.wishlist);
  const [mounted, setMounted] = useState(false);
  // The applied/not-applied state lives in Redux so the checkout page sees it.
  const [promo, setPromo] = useState(promoApplied ? promoCode : "");
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    // Cart is hydrated by the Persistence component in providers.jsx (user-scoped).
    // No need to re-hydrate from localStorage here.
    setMounted(true);
  }, []);

  // The offer is determined ONCE from the total bundle count across the whole
  // cart (never per flavour) using the same source of truth as the backend.
  const orderPricing = calculateOrderBundlePricing(cartItems.map((i) => i.qty));
  const {
    totalBundles,
    regularPrice,
    discount: bundleDiscount,
    subtotal,
    bonusPackets,
  } = orderPricing;

  // Effective price per bundle at the current tier (same for every flavour)
  const perBundle = orderPricing.unitPrice;
  const couponDiscount = promoApplied ? subtotal * 0.1 : 0;
  const shipping = 0; // FREE DELIVERY — always ₹0
  // GST is deactivated: no separate tax line is added. Price shown already
  // includes GST rather than adding it on top — see bundle-pricing.constants.ts.
  const total = subtotal - couponDiscount + shipping;
  const progress = 100; // Always free shipping
  const remaining = 0;

  // `stock` is the product's count in PACKETS; each bundle is 6 packets.
  const handleQty = useCallback((key, delta, curr, stock) => {
    handleQtyHelper(key, delta, curr, stock, dispatch, toast, updateQuantity, MAX_BUNDLES_PER_ITEM);
  }, [dispatch]);

  const handleRemove = (item) => {
    const key = getCartItemKey(item);
    dispatch(removeFromCart(key));
    toast((t) => (
      <span className={styles.undoToast}>
        <span>Removed <strong>{item.name}</strong></span>
        <button onClick={() => { dispatch(addToCart(item, item.qty)); toast.dismiss(t.id); }}>Undo</button>
      </span>
    ), { duration: 4000 });
  };

  const handleSaveLater = (item) => {
    dispatch(removeFromCart(getCartItemKey(item)));
    if (!wishlistItems.some((w) => (w._id || w.id) === (item._id || item.id))) {
      dispatch(addToWishlist(item));
      toast.success(`Saved to wishlist`);
    } else {
      toast(`Removed from cart`);
    }
  };

  const handleApplyPromo = async () => {
    if (!promo.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    setPromoLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promo.trim(),
          cart_total: subtotal,
        }),
      });

      const data = await res.json();

      if (data.success) {
        dispatch(setPromoAppliedAction(true)); // Saved to Redux for the checkout page
        dispatch(setPromoCodeAction(promo.trim()));
        toast.success(`Promo applied! You saved ₹${Number(data.data?.discount_amount || 0).toFixed(0)}`);
      } else {
        toast.error(data.error || "Invalid promo code");
      }
    } catch {
      toast.error("Failed to apply promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromo("");
    dispatch(setPromoAppliedAction(false));
    dispatch(setPromoCodeAction(""));
  };

  const handleCheckout = () => {
    if (!cartItems.length) return;
    router.push("/checkout");
  };

  if (!mounted) return <div className={styles.skeleton}><div className={styles.skeletonBar} /><div className={styles.skeletonBar} /></div>;

  if (!cartItems.length) return (
    <div className={styles.emptyWrap}>
      <motion.div className={styles.emptyCard} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className={styles.emptyIcon}><FiShoppingCart /></div>
        <h2>Your cart is empty</h2>
        <p>Explore our premium Thins collection</p>
        <Link href="/shop" className={styles.shopBtn}>Explore Shop <FiArrowRight /></Link>
      </motion.div>
    </div>
  );

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className="container">
          <div className={styles.headerInner}>
            <Link href="/shop" className={styles.backLink}><FiArrowLeft /> Continue Shopping</Link>
            <div className={styles.headerTitle}>
              <h1>Your <span className="gold-text">Cart</span></h1>
              <span className={styles.itemCount}>{cartItems.length} item{cartItems.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Free shipping bar */}
          <div className={styles.shippingBar}>
            {remaining > 0 ? (
              <>
                <p className={styles.shippingText}>
                  <FiTruck /> Add <strong>₹{remaining.toFixed(0)}</strong> more for free shipping
                </p>
                <div className={styles.progressTrack}>
                  <motion.div className={styles.progressFill} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.7, ease: "easeOut" }} />
                </div>
              </>
            ) : (
              <p className={styles.shippingFree}><FiTruck /> You have unlocked <strong>free shipping!</strong></p>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="container">
        <div className={styles.layout}>

          {/* Items */}
          <div className={styles.itemsCol}>
            <AnimatePresence>
              {cartItems.map((item) => {
                const key = getCartItemKey(item);
                const productId = item._id || item.id;
                const comboParts = item.flavorSelections
                  ? Object.entries(item.flavorSelections).filter(([, count]) => count > 0)
                  : [];
                return (
                  <motion.div
                    key={key}
                    className={styles.item}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                    layout
                  >
                    <Link href={`/product/${productId}`} className={styles.itemImg}>
                      <img src={item.image || "/images/product-methi.jpg"} alt={item.name} />
                    </Link>

                    <div className={styles.itemInfo}>
                      <Link href={`/product/${productId}`} className={styles.itemName}>{item.name}</Link>
                      {item.flavor && <p className={styles.itemFlavor}>{item.flavor}</p>}
                      {comboParts.length > 0 && (
                        <p className={styles.itemFlavor}>
                          {comboParts.map(([id, count]) => `${flavorLabel(id)} ×${count}`).join(", ")}
                        </p>
                      )}
                      <p className={styles.itemWeight}>6 packets per bundle</p>

                      <div className={styles.itemBadges}>
                        {item.isLowGI && <span className={styles.badge}>Low GI</span>}
                        {item.isGlutenFree && <span className={styles.badge}>Gut Healthy</span>}
                        {item.isVegan && <span className={styles.badge}>Vegan</span>}
                      </div>

                      <div className={styles.itemPriceRow}>
                        <span className={styles.itemPrice}>₹{perBundle.toFixed(0)}</span>
                        <span className={styles.itemOriginal} style={{ textDecoration: "none" }}>per bundle</span>
                      </div>

                      <div className={styles.itemActions}>
                        <button className={styles.saveLaterBtn} onClick={() => handleSaveLater(item)}>
                          <FiHeart /> Save for later
                        </button>
                      </div>
                    </div>

                    <div className={styles.itemRight}>
                      <div className={styles.qtyControl}>
                        <button onClick={() => handleQty(key, -1, item.qty, item.countInStock)} aria-label="Decrease quantity"><FiMinus /></button>
                        <span>{item.qty}</span>
                        <button onClick={() => handleQty(key, 1, item.qty, item.countInStock)} aria-label="Increase quantity"><FiPlus /></button>
                      </div>
                      <p className={styles.itemTotal}>{item.qty} {item.qty === 1 ? "bundle" : "bundles"}</p>
                      <button className={styles.removeBtn} onClick={() => handleRemove(item)} aria-label="Remove"><FiTrash2 /></button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className={styles.summaryCol}>
            <div className={styles.summaryCard}>
              <h3>Order Summary</h3>
              <div className="gold-divider" style={{ margin: "12px 0 20px" }} />

              {/* Promo */}
              <div className={styles.promoSection}>
                <div className={styles.promoRow}>
                  <FiTag />
                  <input
                    type="text"
                    placeholder="Promo code"
                    value={promoApplied ? promoCode : promo}
                    onChange={(e) => setPromo(e.target.value)}
                    disabled={promoApplied}
                    className={styles.promoInput}
                  />
                  {!promoApplied ? (
                    <button 
                      className={styles.promoBtn} 
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promo.trim()}
                    >
                      {promoLoading ? "..." : "Apply"}
                    </button>
                  ) : (
                    <button className={styles.promoRemove} onClick={handleRemovePromo}>Remove</button>
                  )}
                </div>
                {promoApplied && <p className={styles.promoSuccess}>✓ {(promoCode || promo).toUpperCase()} applied</p>}
              </div>

              {/* Breakdown */}
              <div className={styles.breakdown}>
                <div className={styles.bRow}>
                  <span>{totalBundles} {totalBundles === 1 ? "Bundle" : "Bundles"} × ₹384</span>
                  <span>₹{regularPrice.toFixed(2)}</span>
                </div>
                {bonusPackets > 0 && (
                  <div className={styles.bRow}>
                    <span>Bonus packets</span>
                    <span>{bonusPackets} FREE</span>
                  </div>
                )}
                {bundleDiscount > 0 && (
                  <div className={`${styles.bRow} ${styles.bDiscount}`}>
                    <span>Bundle discount</span>
                    <span>−₹{bundleDiscount.toFixed(2)}</span>
                  </div>
                )}
                {promoApplied && <div className={`${styles.bRow} ${styles.bDiscount}`}><span>Coupon discount</span><span>−₹{couponDiscount.toFixed(2)}</span></div>}
                <div className={styles.bRow}><span>Shipping</span><span className={shipping === 0 ? styles.free : ""}>{shipping === 0 ? "FREE" : `₹${shipping}`}</span></div>
              </div>

              <div className={styles.totalRow}>
                <span>Total <small style={{ fontWeight: 400, opacity: 0.7 }}>(GST included)</small></span>
                <span>₹{total.toFixed(2)}</span>
              </div>

              <button className={styles.checkoutBtn} onClick={handleCheckout}>
                Proceed to Checkout <FiArrowRight />
              </button>

              <div className={styles.trustRow}>
                <span><FiShield /> Secure Payment</span>
                <span><FiTruck /> Pan India Delivery</span>
                <span><FiPackage /> Easy Returns</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}



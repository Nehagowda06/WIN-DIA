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
import { removeFromCart, updateQuantity, setCart, addToCart } from "@/src/frontend/redux/slices/cartSlice";
import { addToWishlist } from "@/src/frontend/redux/slices/wishlistSlice";
import styles from "./CartPage.module.css";

const FREE_THRESHOLD = 499;

export default function CartPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { cartItems } = useSelector((s) => s.cart);
  const { wishlistItems } = useSelector((s) => s.wishlist);
  const [mounted, setMounted] = useState(false);
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  useEffect(() => {
    try { dispatch(setCart(JSON.parse(localStorage.getItem("cartItems") || "[]"))); } catch {}
    Promise.resolve().then(() => setMounted(true));
  }, [dispatch]);

  const subtotal = cartItems.reduce((a, i) => a + i.price * i.qty, 0);
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const shipping = subtotal >= FREE_THRESHOLD ? 0 : 50;
  const tax = (subtotal - discount) * 0.05;
  const total = subtotal - discount + tax + shipping;
  const progress = Math.min((subtotal / FREE_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_THRESHOLD - subtotal, 0);

  const handleQty = useCallback((id, delta, curr, stock) => {
    const n = curr + delta;
    if (n < 1) return;
    if (n > stock) { toast.error(`Only ${stock} in stock`); return; }
    dispatch(updateQuantity({ id, qty: n }));
  }, [dispatch]);

  const handleRemove = (id, name) => {
    const removed = cartItems.find((i) => (i._id || i.id) === id);
    dispatch(removeFromCart(id));
    toast((t) => (
      <span className={styles.undoToast}>
        <span>Removed <strong>{name}</strong></span>
        <button onClick={() => { dispatch(addToCart(removed)); toast.dismiss(t.id); }}>Undo</button>
      </span>
    ), { duration: 4000 });
  };

  const handleSaveLater = (item) => {
    dispatch(removeFromCart(item._id || item.id));
    if (!wishlistItems.some((w) => (w._id || w.id) === (item._id || item.id))) {
      dispatch(addToWishlist(item));
      toast.success(`Saved to wishlist`);
    } else {
      toast(`Removed from cart`);
    }
  };

  const handleApplyPromo = () => {
    if (promo.toUpperCase() === "WINDIA10") { setPromoApplied(true); toast.success("10% discount applied!"); }
    else toast.error("Invalid promo code");
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
        <p>Explore our premium khakhra collection</p>
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
                const id = item._id || item.id;
                return (
                  <motion.div
                    key={id}
                    className={styles.item}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                    layout
                  >
                    <Link href={`/product/${id}`} className={styles.itemImg}>
                      <img src={item.image || "/images/product-methi.jpg"} alt={item.name} />
                    </Link>

                    <div className={styles.itemInfo}>
                      <Link href={`/product/${id}`} className={styles.itemName}>{item.name}</Link>
                      {item.flavor && <p className={styles.itemFlavor}>{item.flavor}</p>}
                      {item.netWeight && <p className={styles.itemWeight}>{item.netWeight}g</p>}

                      <div className={styles.itemBadges}>
                        {item.isLowGI && <span className={styles.badge}>Low GI</span>}
                        {item.isGlutenFree && <span className={styles.badge}>Gluten Free</span>}
                        {item.isVegan && <span className={styles.badge}>Vegan</span>}
                      </div>

                      <div className={styles.itemPriceRow}>
                        <span className={styles.itemPrice}>₹{item.price}</span>
                        {item.originalPrice > item.price && <span className={styles.itemOriginal}>₹{item.originalPrice}</span>}
                      </div>

                      <div className={styles.itemActions}>
                        <button className={styles.saveLaterBtn} onClick={() => handleSaveLater(item)}>
                          <FiHeart /> Save for later
                        </button>
                      </div>
                    </div>

                    <div className={styles.itemRight}>
                      <div className={styles.qtyControl}>
                        <button onClick={() => handleQty(id, -1, item.qty, item.countInStock || 99)}><FiMinus /></button>
                        <span>{item.qty}</span>
                        <button onClick={() => handleQty(id, 1, item.qty, item.countInStock || 99)}><FiPlus /></button>
                      </div>
                      <p className={styles.itemTotal}>₹{(item.price * item.qty).toFixed(0)}</p>
                      <button className={styles.removeBtn} onClick={() => handleRemove(id, item.name)} aria-label="Remove"><FiTrash2 /></button>
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
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    disabled={promoApplied}
                    className={styles.promoInput}
                  />
                  {!promoApplied ? (
                    <button className={styles.promoBtn} onClick={handleApplyPromo}>Apply</button>
                  ) : (
                    <button className={styles.promoRemove} onClick={() => { setPromoApplied(false); setPromo(""); }}>Remove</button>
                  )}
                </div>
                {promoApplied && <p className={styles.promoSuccess}>✓ WINDIA10 applied — 10% off</p>}
              </div>

              {/* Breakdown */}
              <div className={styles.breakdown}>
                <div className={styles.bRow}><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                {promoApplied && <div className={`${styles.bRow} ${styles.bDiscount}`}><span>Discount</span><span>−₹{discount.toFixed(2)}</span></div>}
                <div className={styles.bRow}><span>Shipping</span><span className={shipping === 0 ? styles.free : ""}>{shipping === 0 ? "FREE" : `₹${shipping}`}</span></div>
                <div className={styles.bRow}><span>GST (5%)</span><span>₹{tax.toFixed(2)}</span></div>
              </div>

              <div className={styles.totalRow}>
                <span>Total</span>
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



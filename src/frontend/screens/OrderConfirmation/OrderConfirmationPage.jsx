"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiCheckCircle, FiPackage, FiMapPin, FiCreditCard,
  FiArrowRight, FiShoppingBag, FiTruck, FiClock
} from "react-icons/fi";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "./OrderConfirmationPage.module.css";

const STATUS_STEPS = ["placed", "confirmed", "processing", "shipped", "out_for_delivery", "delivered"];
const STATUS_LABELS = { placed: "Order Placed", confirmed: "Confirmed", processing: "Processing", shipped: "Shipped", out_for_delivery: "Out for Delivery", delivered: "Delivered" };

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { authFetch, user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !authFetch) return;
    authFetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrder(d.order); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId, authFetch]);

  if (loading) return (
    <div className={styles.loadWrap}>
      <div className={styles.loadCard}>
        <div className={styles.loadSpinner} />
        <p>Loading your order...</p>
      </div>
    </div>
  );

  if (!order) return (
    <div className={styles.loadWrap}>
      <div className={styles.loadCard}>
        <FiPackage size={48} style={{ color: "var(--coco-faint)" }} />
        <h2>Order not found</h2>
        <Link href="/" className={styles.homeBtn}>Go Home</Link>
      </div>
    </div>
  );

  const statusIdx = STATUS_STEPS.indexOf(order.order_status);
  const addr = order.shipping_address || {};

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className="container">
          <motion.div className={styles.heroInner} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <motion.div className={styles.checkIcon} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.2 }}>
              <FiCheckCircle />
            </motion.div>
            <h1>Order <span className="gold-text">Confirmed!</span></h1>
            <p className={styles.heroSub}>Thank you{user?.user_metadata?.name ? `, ${user.user_metadata.name.split(" ")[0]}` : ""}! Your order has been placed successfully.</p>
            <div className={styles.orderBadge}>
              <FiPackage /> Order #{order.order_number}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container">
        <div className={styles.layout}>

          {/* ── Main ── */}
          <div className={styles.main}>

            {/* Status tracker */}
            <motion.div className={styles.card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2><FiTruck style={{ color: "var(--gold)" }} /> Order Status</h2>
              <div className={styles.tracker}>
                {STATUS_STEPS.map((s, i) => (
                  <div key={s} className={styles.trackerStep}>
                    <div className={`${styles.trackerDot} ${i <= statusIdx ? styles.trackerDotDone : ""} ${i === statusIdx ? styles.trackerDotActive : ""}`}>
                      {i < statusIdx ? <FiCheckCircle /> : i + 1}
                    </div>
                    <p className={`${styles.trackerLabel} ${i <= statusIdx ? styles.trackerLabelDone : ""}`}>{STATUS_LABELS[s]}</p>
                    {i < STATUS_STEPS.length - 1 && <div className={`${styles.trackerLine} ${i < statusIdx ? styles.trackerLineDone : ""}`} />}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Order items */}
            <motion.div className={styles.card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2><FiPackage style={{ color: "var(--gold)" }} /> Items Ordered</h2>
              <div className={styles.itemsList}>
                {(order.order_items || []).map((item, i) => (
                  <div key={i} className={styles.orderItem}>
                    <div className={styles.itemImg}>
                      {item.image ? <img src={item.image} alt={item.name} /> : <FiPackage />}
                    </div>
                    <div className={styles.itemDetails}>
                      <p className={styles.itemName}>{item.name}</p>
                      {item.flavor && <p className={styles.itemFlavor}>{item.flavor}</p>}
                      <p className={styles.itemQty}>Qty: {item.qty}</p>
                    </div>
                    <div className={styles.itemPrice}>₹{(item.price * item.qty).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Delivery info */}
            <motion.div className={styles.card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2><FiMapPin style={{ color: "var(--gold)" }} /> Delivery Address</h2>
              <div className={styles.addrBlock}>
                <p className={styles.addrName}>{addr.name}</p>
                <p>{addr.street}</p>
                <p>{addr.city}, {addr.state} — {addr.pincode}</p>
                <p>{addr.phone}</p>
              </div>
            </motion.div>

          </div>

          {/* ── Sidebar ── */}
          <div className={styles.sidebar}>
            <motion.div className={styles.summaryCard} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <h3>Order Summary</h3>
              <div className="gold-divider" style={{ margin: "12px 0 16px" }} />

              <div className={styles.breakdown}>
                <div className={styles.bRow}><span>Items</span><span>₹{order.items_price?.toFixed(2)}</span></div>
                {order.discount_price > 0 && <div className={`${styles.bRow} ${styles.bGreen}`}><span>Discount</span><span>−₹{order.discount_price?.toFixed(2)}</span></div>}
                <div className={styles.bRow}><span>Shipping</span><span className={order.shipping_price === 0 ? styles.free : ""}>{order.shipping_price === 0 ? "FREE" : `₹${order.shipping_price?.toFixed(2)}`}</span></div>
                <div className={styles.bRow}><span>Tax</span><span>₹{order.tax_price?.toFixed(2)}</span></div>
              </div>

              <div className={styles.totalRow}>
                <span>Total Paid</span>
                <span>₹{order.total_price?.toFixed(2)}</span>
              </div>

              {/* Payment info */}
              <div className={styles.payInfo}>
                <FiCreditCard />
                <div>
                  <p className={styles.payLabel}>Payment</p>
                  <p className={styles.payValue}>
                    {order.payment_method === "cod" ? "Cash on Delivery" : "Paid Online"}
                    {" · "}
                    <span className={`${styles.payStatus} ${order.payment_status === "paid" ? styles.payPaid : styles.payPending}`}>
                      {order.payment_status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </p>
                </div>
              </div>

              {/* ETA */}
              <div className={styles.etaBox}>
                <FiClock />
                <div>
                  <p className={styles.etaLabel}>Estimated Delivery</p>
                  <p className={styles.etaValue}>
                    {(() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 5);
                      return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
                    })()}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTA buttons */}
            <motion.div className={styles.ctaCard} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
              <Link href="/shop" className={styles.shopBtn}>
                <FiShoppingBag /> Continue Shopping
              </Link>
              <Link href="/account/orders" className={styles.ordersBtn}>
                View All Orders <FiArrowRight />
              </Link>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}



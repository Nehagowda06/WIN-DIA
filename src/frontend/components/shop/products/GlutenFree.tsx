"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { StaticImageData } from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

import { glutenFreeProducts } from "@/src/frontend/data/products";
import { addToCart, setBuyNowItem } from "@/src/frontend/redux/slices/cartSlice";
import { addToWishlist, removeFromWishlist } from "@/src/frontend/redux/slices/wishlistSlice";

import styles from "./GlutenFree.module.scss";

type Product = {
  readonly id: string;
  readonly dbId?: string;
  readonly title: string;
  readonly name: string;
  readonly flavour: string;
  readonly image: StaticImageData;
  readonly description: string;
  readonly price: string;
  readonly offer?: string;
  readonly offerDetails?: string;
  readonly delivery?: string;
  readonly rating?: string;
  readonly reviews?: string;
  readonly reviewList?: readonly string[];
};

type ProductRangeProps = {
  readonly heading: string;
  readonly headingId: string;
  readonly products: readonly Product[];
  readonly theme: "gluten-free" | "everyday";
};

type ProductInteraction = {
  readonly isWishlisted: boolean;
  readonly quantity: number;
};

function toStoreProduct(product: Product, collection: ProductRangeProps["theme"]) {
  // Use the real Supabase UUID if available (from API), otherwise fall back to slug-based ID
  const id = product.dbId || `${collection}-${product.id}`;

  return {
    id,
    _id: id,
    slug: `${collection}-${product.id}`,
    name: product.name,
    category: collection,
    flavor: product.flavour,
    description: product.description,
    price: Number(product.price.replace(/[^0-9.]/g, "")),
    image: product.image.src,
    countInStock: 100,
    netWeight: 200,
  };
}

type ShowcasePhase = "idle" | "opening" | "expanded" | "closing" | "returning";

const layoutTransition = { type: "spring", stiffness: 240, damping: 28 } as const;

/** Reusable product range layout for the two shop collections. */
export function ProductRange({ heading, headingId, products, theme }: ProductRangeProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [phase, setPhase] = useState<ShowcasePhase>("idle");
  const [interactions, setInteractions] = useState<Record<string, ProductInteraction>>(() =>
  Object.fromEntries(
    products.map((product) => [
      product.id,
      {
        isWishlisted: false,
        quantity: 0,
      },
    ])
  )
);
  const [wishlistSparkles, setWishlistSparkles] = useState<string | null>(null);
  const [cartSparkles, setCartSparkles] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const prefersReducedMotion = useReducedMotion();

  const schedule = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, prefersReducedMotion ? 0 : delay);
    timers.current.push(timer);
  };

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const updateInteraction = (productId: string, update: Partial<ProductInteraction>) => {
    setInteractions((current) => ({
      ...current,
      [productId]: { ...current[productId], ...update },
    }));
  };

  const pulse = (productId: string, kind: "wishlist" | "cart") => {
    if (kind === "wishlist") {
      setWishlistSparkles(productId);
    } else {
      setCartSparkles(productId);
    }

    schedule(() => {
      if (kind === "wishlist") {
        setWishlistSparkles(null);
      } else {
        setCartSparkles(null);
      }
    }, 520);
  };

  const openProduct = (productId: string) => {
    if (phase !== "idle") return;

    setSelectedProductId(productId);
    setPhase("opening");
    schedule(() => setPhase("expanded"), 280);
  };

  const closeProduct = () => {
    if (phase !== "expanded") return;

    setPhase("closing");
    schedule(() => setPhase("returning"), 440);
    schedule(() => {
      setSelectedProductId(null);
      setPhase("idle");
    }, 800);
  };

  return (
    <section className={styles.section} aria-labelledby={headingId} data-navbar-theme={theme}>
      <div className={styles.headingArea}>
        <h2 id={headingId} className={styles.heading}>{heading}</h2>
      </div>

      <motion.div className={styles.products} layout transition={layoutTransition}>
        {products.map((product, index) => {
          const isSelected = selectedProductId === product.id;
          const isExpanded = isSelected && (phase === "expanded" || phase === "closing");
          const isReturning = isSelected && phase === "returning";
          const isFading = selectedProductId !== null && !isSelected && phase !== "idle";
          const isCollapsed = selectedProductId !== null && !isSelected && (
            phase === "expanded" || phase === "closing"
          );
          const showDetails = isSelected && phase === "expanded";

          return (
            <ProductCard
              key={product.id}
              product={product}
              layoutScope={headingId}
              interaction={interactions[product.id]}
              isSelected={isSelected}
              isExpanded={isExpanded}
              isReturning={isReturning}
              isFading={isFading}
              isCollapsed={isCollapsed}
              showDetails={showDetails}
              productOnRight={isProductOnRight(index, theme)}
              showWishlistSparkles={wishlistSparkles === product.id}
              showCartSparkles={cartSparkles === product.id}
              prefersReducedMotion={prefersReducedMotion}
              onOpen={() => openProduct(product.id)}
              onBack={closeProduct}
              onToggleWishlist={() => {
                const nextWishlisted = !interactions[product.id].isWishlisted;
                const storeProduct = toStoreProduct(product, theme);
                if (nextWishlisted) {
                  dispatch(addToWishlist(storeProduct));
                  toast.success("Saved to wishlist");
                } else {
                  dispatch(removeFromWishlist(storeProduct.id));
                  toast("Removed from wishlist");
                }
                updateInteraction(product.id, { isWishlisted: nextWishlisted });
                if (nextWishlisted) pulse(product.id, "wishlist");
              }}
              
              onQuantityChange={(quantity) => {
                const nextQuantity = Math.max(0, quantity);
                const currentQuantity = interactions[product.id].quantity;
                const isFirstItem = interactions[product.id].quantity === 0 && nextQuantity === 1;
                if (nextQuantity > currentQuantity) {
                  dispatch(addToCart(toStoreProduct(product, theme), nextQuantity - currentQuantity));
                  toast.success("Added to cart");
                }
                if (isFirstItem) {
                  pulse(product.id, "cart");
                  schedule(() => updateInteraction(product.id, { quantity: nextQuantity }), 280);
                  return;
                }

                updateInteraction(product.id, { quantity: nextQuantity });
              }}
              onBuyNow={() => {
                dispatch(setBuyNowItem({ product: toStoreProduct(product, theme), qty: 1 }));
                router.push("/checkout");
              }}
            />
          );
        })}
      </motion.div>
    </section>
  );
}

function isProductOnRight(index: number, theme: ProductRangeProps["theme"]) {
  if (index === 0) return true;
  if (index === 2) return false;
  return theme === "everyday";
}

type ProductCardProps = {
  readonly product: Product;
  readonly layoutScope: string;
  readonly interaction: ProductInteraction;
  readonly isSelected: boolean;
  readonly isExpanded: boolean;
  readonly isReturning: boolean;
  readonly isFading: boolean;
  readonly isCollapsed: boolean;
  readonly showDetails: boolean;
  readonly productOnRight: boolean;
  readonly showWishlistSparkles: boolean;
  readonly showCartSparkles: boolean;
  readonly prefersReducedMotion: boolean | null;
  readonly onOpen: () => void;
  readonly onBack: () => void;
  readonly onToggleWishlist: () => void;
  readonly onQuantityChange: (quantity: number) => void;
  readonly onBuyNow: () => void;
};

function ProductCard({
  product,
  layoutScope,
  interaction,
  isSelected,
  isExpanded,
  isReturning,
  isFading,
  isCollapsed,
  showDetails,
  productOnRight,
  showWishlistSparkles,
  showCartSparkles,
  prefersReducedMotion,
  onOpen,
  onBack,
  onToggleWishlist,
  onQuantityChange,
  onBuyNow,
}: ProductCardProps) {
  const detailsOnLeft = productOnRight;

  return (
    <motion.article
      className={`${styles.card} ${isExpanded ? styles.cardExpanded : ""} ${
        isReturning ? styles.cardReturning : ""
      } ${isFading ? styles.cardFading : ""} ${isCollapsed ? styles.cardCollapsed : ""} ${
        productOnRight ? styles.productOnRight : styles.productOnLeft
      }`}
      data-product={product.id}
      layout
      transition={layoutTransition}
    >
      <div className={styles.showcase}>
        <motion.div
          className={styles.imageFrame}
          layout
          layoutId={`${layoutScope}-${product.id}-image`}
          transition={layoutTransition}
        >
          <button
            className={styles.cardTrigger}
            type="button"
            aria-label={`Show ${product.name} details`}
            disabled={isSelected}
            onClick={onOpen}
          />
          <motion.div
            className={styles.productVisual}
            animate={{ scale: isExpanded ? 1.08 : 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
          >
            <Image
              className={styles.image}
              src={product.image}
              alt={`Windia Thins ${product.name}`}
              fill
              sizes="(max-width: 768px) 100vw, 33.333vw"
            />
          </motion.div>

          <div className={styles.copy}>
            <p className={styles.productType}>Thins</p>
            <h3 className={styles.productName}>{product.name}</h3>
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.button
                className={`${styles.wishlistButton} ${styles.wishlistOutwardRight} ${
                  interaction.isWishlisted ? styles.wishlistActive : ""
                }`}
                type="button"
                aria-label={`${interaction.isWishlisted ? "Remove" : "Add"} ${product.name} ${interaction.isWishlisted ? "from" : "to"} wishlist`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: interaction.isWishlisted ? [1, 1.13, 1] : 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: 0.34, ease: "easeInOut" }}
                onClick={onToggleWishlist}
              >
                {interaction.isWishlisted ? "♥" : "♡"}
                <AnimatePresence>{showWishlistSparkles && <Sparkles className={styles.heartSparkles} />}</AnimatePresence>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {showDetails && (
            <motion.button
              className={styles.backButton}
              type="button"
              aria-label="Back to products"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.22, delay: 0.24, ease: "easeOut" }}
              onClick={onBack}
            >
              {"\u2190"}
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDetails && (
            <motion.aside
              className={`${styles.infoPanel} ${detailsOnLeft ? styles.infoPanelLeft : styles.infoPanelRight}`}
              aria-label={`${product.name} details`}
              initial={{ clipPath: detailsOnLeft ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0 0 0)" }}
              exit={{ clipPath: detailsOnLeft ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)" }}
              transition={{ duration: 0.42, ease: "easeInOut" }}
            >
              <motion.div
                className={styles.infoContent}
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                transition={{ duration: 0.28, delay: 0.3, ease: "easeOut" }}
              >
                <p className={styles.infoEyebrow}>{product.title}</p>
                <h3 className={styles.infoName}>{product.name}</h3>
                <p className={styles.flavour}>Flavour: {product.flavour}</p>
                <p className={styles.description}>{product.description}</p>
                
                <p className={styles.price}>{product.price}</p>
                {product.offer && (
                  <p className={styles.offer}>{product.offer}</p>
                )}

                {product.offerDetails && (
                  <p className={styles.offerDetails}>{product.offerDetails}</p>
                )}

                {product.delivery && (
                  <p className={styles.delivery}>{product.delivery}</p>
                )}

                

                <AnimatePresence mode="wait" initial={false}>
                  {interaction.quantity === 0 ? (
                    <motion.button
                      key="add-to-cart"
                      className={styles.addToCartButton}
                      type="button"
                      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
                      animate={{ opacity: 1, y: 0, scale: showCartSparkles ? [1, 1.06, 1] : 1 }}
                      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
                      transition={{
                        opacity: { duration: 0.24, delay: 0.38, ease: "easeOut" },
                        y: { duration: 0.24, delay: 0.38, ease: "easeOut" },
                        scale: { duration: 0.32, ease: "easeInOut" },
                      }}
                      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                      onClick={() => onQuantityChange(1)}
                    >
                      Add to Cart
                      <AnimatePresence>{showCartSparkles && <Sparkles className={styles.cartSparkles} />}</AnimatePresence>
                    </motion.button>
                  ) : (
                    <motion.div key="quantity-control" className={styles.quantityControl} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: "easeOut" }}>
                      <button type="button" aria-label={`Remove one ${product.name}`} onClick={() => onQuantityChange(interaction.quantity - 1)}>−</button>
                      <span aria-live="polite">{interaction.quantity}</span>
                      <button type="button" aria-label={`Add one ${product.name}`} onClick={() => onQuantityChange(interaction.quantity + 1)}>+</button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.button
                  className={`${styles.addToCartButton} ${styles.buyNowButton}`}
                  type="button"
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
                  transition={{ duration: 0.24, delay: 0.42, ease: "easeOut" }}
                  whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  onClick={onBuyNow}
                >
                  Buy Now
                </motion.button>
              </motion.div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

function Sparkles({ className }: { readonly className: string }) {
  return (
    <motion.span className={className} aria-hidden="true" initial="hidden" animate="visible" exit="hidden">
      {[0, 1, 2, 3].map((index) => (
        <motion.span
          key={index}
          className={styles.sparkle}
          variants={{
            hidden: { opacity: 0, scale: 0.4 },
            visible: { opacity: [0, 1, 0], scale: [0.4, 1, 0.55], transition: { duration: 0.48, delay: index * 0.035, ease: "easeOut" } },
          }}
        >
          ✦
        </motion.span>
      ))}
    </motion.span>
  );
}

/** Gluten-free product range displayed on the shop landing page. */
export function GlutenFree({ products }: { products?: readonly Product[] }) {
  const data = products?.length ? products : glutenFreeProducts;
  return <ProductRange heading="The Gluten Free Range" headingId="gluten-free-heading" products={data} theme="gluten-free" />;
}

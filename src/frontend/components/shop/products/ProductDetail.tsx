"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useMemo, type TouchEvent } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import { addToCart } from "@/src/frontend/redux/slices/cartSlice";
import {
  addToWishlist,
  removeFromWishlist,
} from "@/src/frontend/redux/slices/wishlistSlice";
import { supabase } from "@/src/frontend/lib/supabase/client";

import { ProductCard } from "./ProductCard";
import { Breadcrumbs } from "@/src/frontend/components/Seo/Breadcrumbs";
import {
  findProductByRouteId,
  getRecommendations,
} from "./productLookup";
import {
  toStoreProduct,
  type Product,
  type ProductTheme,
} from "./productShared";
import { ComboSelector } from "./ComboSelector";
import { comboFlavors, handleComboConfirm } from "./comboHelpers";

import styles from "./ProductDetail.module.scss";

type ProductDetailProps = {
  /** The route id from the URL, e.g. "everyday-oat-thins". */
  readonly routeId: string;
};

export function ProductDetail({ routeId }: ProductDetailProps) {
  const match = findProductByRouteId(routeId);

  if (!match) {
    return (
      <section className={styles.section}>
        <div className={styles.notFound}>
          <p className={styles.infoEyebrow}>Windia Thins</p>

          <h1 className={styles.infoName}>
            We couldn&apos;t find that product
          </h1>

          <p className={styles.description}>
            It may have been renamed or removed.
          </p>

          <Link className={styles.backLink} href="/">
            Back to shop
          </Link>
        </div>
      </section>
    );
  }

  return (
    <ProductDetailContent
      product={match.product}
      theme={match.theme}
      routeId={routeId}
    />
  );
}

function ProductDetailContent({
  product,
  theme,
  routeId,
}: {
  product: Product;
  theme: ProductTheme;
  routeId: string;
}) {
  const dispatch = useDispatch();
  const router = useRouter();
  const wishlistItems = useSelector((s: any) => s.wishlist.wishlistItems);

  /* -----------------------------
     Main product state
  ----------------------------- */

  const [quantity, setQuantityState] = useState(0);
  
  const storeProduct = useMemo(() => toStoreProduct(product, theme), [product, theme]);
  const isWishlisted = useMemo(() => 
    wishlistItems.some((item: any) => (item.id || item._id) === storeProduct.id),
    [wishlistItems, storeProduct.id]
  );

  /* -----------------------------
     Combo Selector (for combo products)
  ----------------------------- */
  const isComboProduct = product.name?.toLowerCase().includes('combo') || 
                          product.name?.toLowerCase().includes('assorted');
  
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);

  // Define available flavors for combo

  const handleComboConfirmCallback = (selections: Record<string, number>) =>
    handleComboConfirm(selections, storeProduct, dispatch, quantity, setQuantityState, toast);

  /* -----------------------------
     Product image carousel
  ----------------------------- */

  const detailImages = Array.isArray(product.image)
    ? product.image
    : [product.image];

  const [detailImageIndex, setDetailImageIndex] = useState(0);

  const touchStartX = useRef<number | null>(null);

  const nextDetailImage = () => {
    setDetailImageIndex((current) =>
      current === detailImages.length - 1 ? 0 : current + 1
    );
  };

  const previousDetailImage = () => {
    setDetailImageIndex((current) =>
      current === 0 ? detailImages.length - 1 : current - 1
    );
  };

  const handleDetailTouchStart = (
    event: TouchEvent<HTMLDivElement>
  ) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleDetailTouchEnd = (
    event: TouchEvent<HTMLDivElement>
  ) => {
    if (touchStartX.current === null) return;

    const touchEndX = event.changedTouches[0].clientX;

    const difference =
      touchStartX.current - touchEndX;

    if (Math.abs(difference) > 50) {
      if (difference > 0) {
        nextDetailImage();
      } else {
        previousDetailImage();
      }
    }

    touchStartX.current = null;
  };

  /* -----------------------------
     Recommendations state
  ----------------------------- */

  const [recQuantities, setRecQuantities] =
    useState<Record<string, number>>({});

  const recWishlistedIds = useMemo(() => 
    new Set(wishlistItems.map((item: any) => item.id || item._id)),
    [wishlistItems]
  );

  /* -----------------------------
     Authentication
  ----------------------------- */

  const requireAuthForWishlist = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?next=/product/${routeId}`);
      return false;
    }

    return true;
  };

  /* -----------------------------
     Main product quantity
  ----------------------------- */

  const setQuantity = async (next: number) => {
    const nextQuantity = Math.max(0, next);

    if (nextQuantity > quantity) {
      // No auth required for adding to cart
      dispatch(
        addToCart(
          toStoreProduct(product, theme),
          nextQuantity - quantity
        )
      );

      toast.success("Added to cart");
    }

    setQuantityState(nextQuantity);
  };

  /* -----------------------------
     Main product wishlist
  ----------------------------- */

  const toggleWishlist = async () => {
    const next = !isWishlisted;

    if (next && !(await requireAuthForWishlist())) return;

    if (next) {
      dispatch(addToWishlist(storeProduct));
      toast.success("Saved to wishlist");
    } else {
      dispatch(removeFromWishlist(storeProduct.id));
      toast("Removed from wishlist");
    }
  };

  /* -----------------------------
     Buy Now
  ----------------------------- */

  const buyNow = async () => {
    // No auth required - will check at checkout
    dispatch(
      addToCart(
        toStoreProduct(product, theme),
        1
      )
    );

    toast.success("Added to cart");

    router.push("/checkout");
  };

  /* -----------------------------
     Recommendations
  ----------------------------- */

  const recommendations = getRecommendations(
    routeId,
    theme,
    4
  );

  /* -----------------------------
     Recommendation quantity
  ----------------------------- */

  const setRecQuantity = async (
    recRouteId: string,
    recProduct: Product,
    recTheme: ProductTheme,
    next: number
  ) => {
    const nextQuantity = Math.max(0, next);

    const current =
      recQuantities[recRouteId] ?? 0;

    // A combo needs a flavour selection, so send the shopper to its page
    // instead of adding a plain combo to the cart.
    if (recTheme === "combo" && nextQuantity > current) {
      router.push(`/product/${recRouteId}`);
      return;
    }

    if (nextQuantity > current) {
      // No auth required for adding to cart
      dispatch(
        addToCart(
          toStoreProduct(recProduct, recTheme),
          nextQuantity - current
        )
      );

      toast.success("Added to cart");
    }

    setRecQuantities((q) => ({
      ...q,
      [recRouteId]: nextQuantity,
    }));
  };

  /* -----------------------------
     Recommendation wishlist
  ----------------------------- */

  const toggleRecWishlist = async (
    recRouteId: string,
    recProduct: Product,
    recTheme: ProductTheme
  ) => {
    const storeProduct = toStoreProduct(recProduct, recTheme);
    const next = !recWishlistedIds.has(storeProduct.id);

    if (next && !(await requireAuthForWishlist())) return;

    if (next) {
      dispatch(addToWishlist(storeProduct));
      toast.success("Saved to wishlist");
    } else {
      dispatch(
        removeFromWishlist(storeProduct.id)
      );

      toast("Removed from wishlist");
    }
  };

  /* -----------------------------
     Page
  ----------------------------- */

  const isAssorted = product.flavour.toLowerCase() === "assorted";
  const displayName = isAssorted
    ? product.name
    : `${product.flavour} FibreRich Thins`;

  return (
    <section
      className={styles.section}
      data-navbar-theme={theme}
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Shop", href: "/shop" },
          { name: displayName },
        ]}
      />

      <div className={styles.detail}>

        {/* =========================
    PRODUCT IMAGE GALLERY
========================= */}

<div
  className={styles.detailImage}
  onTouchStart={handleDetailTouchStart}
  onTouchEnd={handleDetailTouchEnd}
>
  {/* Bundle badge */}
  <div className={styles.bundleBadge}>
    6-PACKET BUNDLE
  </div>

  {/* Wishlist heart */}
  <button
    type="button"
    className={styles.imageWishlist}
    onClick={toggleWishlist}
    aria-label="Add to wishlist"
  >
    {isWishlisted ? "♥" : "♡"}
  </button>

  {/* Product image */}
  <Image
    src={detailImages[detailImageIndex]}
    alt={`Windia Thins ${product.name} - Image ${
      detailImageIndex + 1
    }`}
    fill
    className={styles.detailProductImage}
    sizes="(max-width: 768px) 100vw, 45vw"
    priority={detailImageIndex === 0}
  />

  {/* Previous */}
  {detailImages.length > 1 && (
    <button
      type="button"
      className={`${styles.detailArrow} ${styles.detailPrevButton}`}
      onClick={previousDetailImage}
      aria-label="Previous product image"
    >
      ‹
    </button>
  )}

  {/* Next */}
  {detailImages.length > 1 && (
    <button
      type="button"
      className={`${styles.detailArrow} ${styles.detailNextButton}`}
      onClick={nextDetailImage}
      aria-label="Next product image"
    >
      ›
    </button>
  )}

  {/* Dots */}
  {detailImages.length > 1 && (
    <div className={styles.detailImageDots}>
      {detailImages.map((_, index) => (
        <button
          key={index}
          type="button"
          className={`${styles.detailImageDot} ${
            index === detailImageIndex
              ? styles.detailImageDotActive
              : ""
          }`}
          onClick={() => setDetailImageIndex(index)}
          aria-label={`Show product image ${index + 1}`}
        />
      ))}
    </div>
  )}
</div>

        {/* =========================
            PRODUCT INFORMATION
        ========================= */}

        <div className={styles.detailContent}>

          {/* Product eyebrow */}

          <p className={styles.infoEyebrow}>
            {product.title}
          </p>

          {/* Product name */}

          <h1 className={styles.infoName}>
            {displayName}
          </h1>

          {/* Description */}

          <p className={styles.description}>
            {product.description}
          </p>

          {/* Price */}

          <p className={styles.price}>
            {product.price}
          </p>

          {/* Offer */}

          {product.offer && (
            <p className={styles.offer}>
              {product.offer}
            </p>
          )}

          {/* Offer details */}

          {product.offerDetails && (
            <p className={styles.offerDetails}>
              {product.offerDetails}
            </p>
          )}

          {/* Delivery */}

          {product.delivery && (
            <p className={styles.delivery}>
              {product.delivery}
            </p>
          )}

          {/* Contextual links */}

          <p className={styles.contextLinks}>
            <Link href="/health-benefits">
              See the GI value and nutrition behind these thins
            </Link>
            <span aria-hidden="true"> · </span>
            <Link href="/shop">
              Explore all FibreRich Thins flavours
            </Link>
          </p>

          {/* Quantity controls */}

          <div className={styles.quantity}>
            <button
              type="button"
              onClick={() =>
                setQuantity(quantity - 1)
              }
              disabled={quantity === 0}
              aria-label="Decrease quantity"
            >
              −
            </button>

            <span>{quantity}</span>

            <button
              type="button"
              onClick={() => {
                if (isComboProduct) {
                  setIsComboModalOpen(true);
                } else {
                  setQuantity(quantity + 1);
                }
              }}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          {/* Add to cart */}

          <button
            type="button"
            onClick={() => {
              if (isComboProduct) {
                setIsComboModalOpen(true);
              } else {
                setQuantity(quantity + 1);
              }
            }}
            className={styles.addToCart}
          >
            {isComboProduct ? 'Customize Combo' : 'Add to Cart'}
          </button>

          {/* Buy now */}

          <button
            type="button"
            onClick={() => {
              if (isComboProduct) {
                setIsComboModalOpen(true);
              } else {
                buyNow();
              }
            }}
            className={styles.buyNow}
          >
            Buy Now
          </button>

         
        </div>
      </div>

      {/* =========================
          RECOMMENDATIONS
      ========================= */}

      {recommendations.length > 0 && (
        <div
          className={styles.recommendations}
        >
          <h2
            className={
              styles.recommendationsHeading
            }
          >
            You might also like
          </h2>

          <ul
            className={
              styles.recommendationsGrid
            }
          >
            {recommendations.map(
              ({
                product: recProduct,
                theme: recTheme,
                routeId: recRouteId,
              }) => (
                <ProductCard
                  key={recRouteId}
                  product={recProduct}
                  theme={recTheme}
                  quantity={
                    recQuantities[
                      recRouteId
                    ] ?? 0
                  }
                  isWishlisted={
                    recWishlistedIds.has(
                      toStoreProduct(recProduct, recTheme).id
                    )
                  }
                  onQuantityChange={(q) =>
                    setRecQuantity(
                      recRouteId,
                      recProduct,
                      recTheme,
                      q
                    )
                  }
                  onToggleWishlist={() =>
                    toggleRecWishlist(
                      recRouteId,
                      recProduct,
                      recTheme
                    )
                  }
                />
              )
            )}
          </ul>
        </div>
      )}

      {/* Combo Selector Modal */}
      {isComboProduct && (
        <ComboSelector
          isOpen={isComboModalOpen}
          onClose={() => setIsComboModalOpen(false)}
          onConfirm={handleComboConfirmCallback}
          availableFlavors={comboFlavors}
        />
      )}
    </section>
  );
}
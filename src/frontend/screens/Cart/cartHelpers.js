// `stock` is the product's count in PACKETS; each bundle is 6 packets.
export function handleQty(key, delta, curr, stock, dispatch, toast, updateQuantity, MAX_BUNDLES_PER_ITEM) {
  const n = curr + delta;
  if (n < 1) return;
  const maxBundles = Math.min(
    MAX_BUNDLES_PER_ITEM,
    Number.isFinite(stock) ? Math.floor(stock / 6) : MAX_BUNDLES_PER_ITEM
  );
  if (n > maxBundles) {
    toast.error(maxBundles >= MAX_BUNDLES_PER_ITEM ? `Maximum ${MAX_BUNDLES_PER_ITEM} bundles per item` : `Only ${maxBundles} bundle${maxBundles === 1 ? "" : "s"} in stock`);
    return;
  }
  dispatch(updateQuantity({ id: key, qty: n }));
}

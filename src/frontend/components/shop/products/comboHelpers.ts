import { addToCart } from "@/src/frontend/redux/slices/cartSlice";

export const comboFlavors = [
  { id: 'curry-leaves', name: 'Curry Leaves', available: true, stock: 100 },
  { id: 'garlic', name: 'Garlic', available: true, stock: 100 },
  { id: 'jeera', name: 'Jeera', available: true, stock: 100 },
  { id: 'onion', name: 'Onion', available: true, stock: 100 },
];

export async function handleComboConfirm(
  selections: Record<string, number>,
  storeProduct: any,
  dispatch: (action: any) => any,
  quantity: number,
  setQuantityState: (n: number) => void,
  toast: { success: (msg: string) => void }
): Promise<void> {
  // No auth required for adding combo to cart
  // Add combo with user's flavor selections
  const comboProduct = {
    ...storeProduct,
    flavorSelections: selections,
    customNote: `Combo: ${Object.entries(selections)
      .filter(([_, count]) => count > 0)
      .map(([id, count]) => {
        const flavor = comboFlavors.find(f => f.id === id);
        return `${flavor?.name} (${count})`;
      })
      .join(', ')}`
  };

  dispatch(addToCart(comboProduct, 1));
  toast.success("Combo added to cart with your flavor selection!");
  // Only update the on-screen counter. Calling setQuantity() here would
  // dispatch a second addToCart (a plain combo with no flavour selection).
  setQuantityState(quantity + 1);
}

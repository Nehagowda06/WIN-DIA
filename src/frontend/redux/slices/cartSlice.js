import { createSlice } from "@reduxjs/toolkit";

const getId = (item) => item?._id || item?.id;
const normalize = (item, qty = 1) => ({ ...item, _id: item?._id || item?.id, id: item?.id || item?._id, qty: Number(item?.qty || qty || 1) });

const cartSlice = createSlice({
  name: "cart",
  initialState: { cartItems: [], shippingAddress: null, paymentMethod: null, promoApplied: false },
  reducers: {
    setCart: (s, a) => { s.cartItems = Array.isArray(a.payload) ? a.payload.map((i) => normalize(i)) : []; },
    addToCart: {
      reducer: (s, a) => {
        const item = normalize(a.payload.product || a.payload, a.payload.qty);
        const existing = s.cartItems.find((c) => getId(c) === getId(item));
        if (existing) existing.qty += Number(item.qty || 1);
        else s.cartItems.push(item);
      },
      prepare: (product, qty = 1) => ({ payload: { product, qty } }),
    },
    removeFromCart: (s, a) => { s.cartItems = s.cartItems.filter((i) => getId(i) !== a.payload); },
    updateQuantity: (s, a) => { const item = s.cartItems.find((i) => getId(i) === a.payload.id); if (item) item.qty = Math.max(1, Number(a.payload.qty)); },
    clearCart: (s) => { s.cartItems = []; },
    saveShippingAddress: (s, a) => { s.shippingAddress = a.payload; },
    savePaymentMethod: (s, a) => { s.paymentMethod = a.payload; },
    setPromoApplied: (s, a) => { s.promoApplied = Boolean(a.payload); },
  },
});

export const { setCart, addToCart, removeFromCart, updateQuantity, clearCart, saveShippingAddress, savePaymentMethod, setPromoApplied } = cartSlice.actions;
export default cartSlice.reducer;

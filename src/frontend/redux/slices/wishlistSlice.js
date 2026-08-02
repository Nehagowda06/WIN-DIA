import { createSlice } from "@reduxjs/toolkit";
const getId = (i) => i?._id || i?.id;
const norm = (i) => ({ ...i, _id: i?._id || i?.id, id: i?.id || i?._id });

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: { wishlistItems: [] },
  reducers: {
    setWishlist: (s, a) => { s.wishlistItems = Array.isArray(a.payload) ? a.payload.map(norm) : []; },
    addToWishlist: (s, a) => { const item = norm(a.payload); if (!s.wishlistItems.some((e) => getId(e) === getId(item))) s.wishlistItems.push(item); },
    removeFromWishlist: (s, a) => { s.wishlistItems = s.wishlistItems.filter((i) => getId(i) !== a.payload); },
    clearWishlist: (s) => { s.wishlistItems = []; },
  },
});
export const { setWishlist, addToWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;

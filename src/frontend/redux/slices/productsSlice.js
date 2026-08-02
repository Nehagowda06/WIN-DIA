import { createSlice } from "@reduxjs/toolkit";

const productsSlice = createSlice({
  name: "products",
  initialState: { products: [], loading: false, error: null },
  reducers: {
    setProducts: (s, a) => { s.products = a.payload; s.loading = false; },
    setLoading: (s, a) => { s.loading = a.payload; },
    setError: (s, a) => { s.error = a.payload; s.loading = false; },
  },
});
export const { setProducts, setLoading, setError } = productsSlice.actions;
export default productsSlice.reducer;

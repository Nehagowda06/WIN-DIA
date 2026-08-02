"use client";
// DEV ONLY — quick way to fill cart and test checkout without a shop page
import { useDispatch } from "react-redux";
import { addToCart } from "@/src/frontend/redux/slices/cartSlice";
import { useRouter } from "next/navigation";

const TEST_PRODUCTS = [
  { _id: "11111111-1111-4111-8111-111111111111", id: "11111111-1111-4111-8111-111111111111", name: "Methi Khakhra", price: 189, originalPrice: 229, image: "/images/product-methi.jpg", countInStock: 10, netWeight: 180, isLowGI: true, isGlutenFree: true, isVegan: true, flavor: "Methi" },
  { _id: "22222222-2222-4222-8222-222222222222", id: "22222222-2222-4222-8222-222222222222", name: "Garlic Khakhra", price: 199, originalPrice: 249, image: "/images/product-garlic.png", countInStock: 8, netWeight: 180, isLowGI: true, isGlutenFree: true, isVegan: true, flavor: "Garlic" },
  { _id: "33333333-3333-4333-8333-333333333333", id: "33333333-3333-4333-8333-333333333333", name: "Moringa Khakhra", price: 209, originalPrice: 259, image: "/images/product-moringa.png", countInStock: 12, netWeight: 180, isLowGI: true, isGlutenFree: true, isVegan: true, flavor: "Moringa" },
];

export default function DevTest() {
  const dispatch = useDispatch();
  const router = useRouter();

  const addAndGoToCart = () => {
    TEST_PRODUCTS.forEach((p) => dispatch(addToCart(p, 1)));
    router.push("/cart");
  };

  const addAndGoToCheckout = () => {
    TEST_PRODUCTS.forEach((p) => dispatch(addToCart(p, 1)));
    router.push("/checkout");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FDF6EC", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: 48, border: "1px solid #EDE0CC", boxShadow: "0 8px 24px rgba(59,31,15,.10)", maxWidth: 480, width: "100%", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "#3B1F0F", marginBottom: 8 }}>DEV Test Page</h1>
        <p style={{ color: "#7A5C44", marginBottom: 32, fontSize: 14 }}>Fills cart with test products for checkout testing</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={addAndGoToCart} style={{ padding: "14px 24px", background: "linear-gradient(135deg,#3B1F0F,#5C3520)", color: "#FDF6EC", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
            Add to Cart → Go to Cart
          </button>
          <button onClick={addAndGoToCheckout} style={{ padding: "14px 24px", background: "linear-gradient(135deg,#C9A84C,#A68930)", color: "#3B1F0F", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
            Add to Cart → Go to Checkout
          </button>
        </div>

        <div style={{ marginTop: 32, textAlign: "left" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#7A5C44", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Test Products Added:</p>
          {TEST_PRODUCTS.map((p) => (
            <div key={p._id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #EDE0CC", fontSize: 14, color: "#3B1F0F" }}>
              <span>{p.name}</span><span style={{ fontWeight: 700 }}>₹{p.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


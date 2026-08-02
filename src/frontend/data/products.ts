import curryLeafImage from "@/src/frontend/assets/images/products/gluten-free/curryleaf.png";
import garlicImage from "@/src/frontend/assets/images/products/gluten-free/garlic.png";
import onionImage from "@/src/frontend/assets/images/products/gluten-free/onion.png";
import everydayCurryLeafImage from "@/src/frontend/assets/images/products/everyday/curryleaf.png";
import everydayGarlicImage from "@/src/frontend/assets/images/products/everyday/garlic.png";
import everydayOnionImage from "@/src/frontend/assets/images/products/everyday/onion.png";

export const glutenFreeProducts = [
  {
    id: "onion",
    title: "Fiber Rich Thins",
    name: "Onion Flavour",
    flavour: "Onion",
    image: onionImage,
    description: "A crisp, fibre-rich snack with the mellow sweetness of roasted onion.",
    price: "₹99",
    rating: "4.8",
    reviews: "120",
    reviewList: ["Perfectly crisp with a balanced onion flavour.", "A deliciously light snack for my afternoon break.", "Great texture and a very satisfying crunch."],
  },
  {
    id: "garlic",
    title: "Fiber Rich Thins",
    name: "Garlic Flavour",
    flavour: "Garlic",
    image: garlicImage,
    description: "A bold, savoury crunch layered with warm roasted garlic notes.",
    price: "₹99",
    rating: "4.8",
    reviews: "120",
    reviewList: ["The garlic flavour is rich without being overpowering.", "Crisp, savoury and wonderfully moreish.", "An easy everyday snack with a lovely finish."],
  },
  {
    id: "curry-leaf",
    title: "Fiber Rich Thins",
    name: "Curry Leaf Flavour",
    flavour: "Curry Leaf",
    image: curryLeafImage,
    description: "A fragrant, savoury bite finished with aromatic curry leaf.",
    price: "₹99",
    rating: "4.8",
    reviews: "120",
    reviewList: ["The curry leaf aroma is beautifully fresh.", "A uniquely flavourful, crunchy snack.", "I love the savoury seasoning and light texture."],
  },
] as const;

export const everydayProducts = [
  {
    id: "onion",
    title: "Everyday Thins",
    name: "Onion Flavour",
    flavour: "Onion",
    image: everydayOnionImage,
    description: "A satisfying daily crunch with naturally savoury onion flavour.",
    price: "₹99",
    rating: "4.8",
    reviews: "120",
    reviewList: ["My go-to snack when I want something savoury.", "Light, crisp and full of gentle onion flavour.", "Perfect with a cup of tea in the afternoon."],
  },
  {
    id: "garlic",
    title: "Everyday Thins",
    name: "Garlic Flavour",
    flavour: "Garlic",
    image: everydayGarlicImage,
    description: "A comforting garlic-forward snack for everyday moments.",
    price: "₹99",
    rating: "4.8",
    reviews: "120",
    reviewList: ["A warm garlic flavour with a wonderfully crisp bite.", "Simple, delicious and very easy to share.", "The pack never lasts long in our home."],
  },
  {
    id: "curry-leaf",
    title: "Everyday Thins",
    name: "Curry Leaf Flavour",
    flavour: "Curry Leaf",
    image: everydayCurryLeafImage,
    description: "A light, flavourful crunch with a herbaceous curry leaf finish.",
    price: "₹99",
    rating: "4.8",
    reviews: "120",
    reviewList: ["A fresh curry leaf flavour that feels distinct.", "Crisp, light and a great pantry staple.", "The savoury seasoning is just right."],
  },
] as const;

type StoreProduct = {
  readonly id: string;
  readonly _id: string;
  readonly slug: string;
  readonly name: string;
  readonly category: string;
  readonly flavor: string;
  readonly description: string;
  readonly price: number;
  readonly image: string;
  readonly countInStock: number;
  readonly netWeight: number;
};

const asStoreProduct = (
  product: (typeof glutenFreeProducts)[number] | (typeof everydayProducts)[number],
  collection: "gluten-free" | "everyday",
): StoreProduct => {
  const id = `${collection}-${product.id}`;

  return {
    id,
    _id: id,
    slug: id,
    name: product.name,
    category: collection,
    flavor: product.flavour,
    description: product.description,
    price: Number(product.price.replace(/[^0-9.]/g, "")),
    image: product.image.src,
    countInStock: 100,
    netWeight: 200,
  };
};

/** Storefront fallback data used when Supabase has no active products yet. */
export const localProducts = [
  ...glutenFreeProducts.map((product) => asStoreProduct(product, "gluten-free")),
  ...everydayProducts.map((product) => asStoreProduct(product, "everyday")),
];

/** Normalizes the planned Supabase product shape for the existing storefront. */
export const normalizeProduct = (product: Record<string, unknown>): StoreProduct => {
  const id = String(product.id ?? product._id ?? "");

  return {
    id,
    _id: String(product._id ?? id),
    slug: String(product.slug ?? id),
    name: String(product.name ?? "WIN-DIA Product"),
    category: String(product.category ?? "snacks"),
    flavor: String(product.flavor ?? product.flavour ?? ""),
    description: String(product.description ?? ""),
    price: Number(product.price ?? 0),
    image: String(product.image ?? product.image_url ?? ""),
    countInStock: Number(product.countInStock ?? product.count_in_stock ?? 0),
    netWeight: Number(product.netWeight ?? product.net_weight ?? product.weight ?? 0),
  };
};

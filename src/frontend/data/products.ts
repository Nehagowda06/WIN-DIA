import jeeraImage from "@/src/frontend/assets/images/products/gluten-free/jeera.png";
import jeerabackImage from "@/src/frontend/assets/images/products/gluten-free/jeeraback.png";
import everydayCurryLeafImage from "@/src/frontend/assets/images/products/everyday/curryleaf.png";
import everydayCurryLeafbackImage from "@/src/frontend/assets/images/products/everyday/curryleafback.png";
import everydayGarlicImage from "@/src/frontend/assets/images/products/everyday/garlic.png";
import everydayGarlicbackImage from "@/src/frontend/assets/images/products/everyday/garlicback.png";
import everydayOnionImage from "@/src/frontend/assets/images/products/everyday/onion.png";
import everydayOnionbackImage from "@/src/frontend/assets/images/products/everyday/onionback.png";
import comboImage from "@/src/frontend/assets/images/products/combo/combo-offer.png";

export const glutenFreeProducts = [
  {
    id: "jeera",
    title: "Fiber Rich Thins",
    name: "Jeera Flavour",
    flavour: "Jeera",
    image: [jeeraImage, jeerabackImage],
    description: "Roasted jeera, deep and comforting in every bite.",
    price: "₹640",
    offer: "12-Packet Bundle",
    offerDetails: "🎁 Pay for 10 + Get 2 FREE",
    delivery: "🚚 Free Delivery",
  
  },

 
] as const;

export const everydayProducts = [
  {
    id: "onion",
    title: "Everyday Thins",
    name: "Onion Flavour",
    flavour: "Onion",
    image: [everydayOnionImage, everydayOnionbackImage],
    description: "A satisfying daily crunch with naturally savoury onion flavour.",
    price: "₹640",
    offer: "12-Packet Bundle",
    offerDetails: "🎁 Pay for 10 + Get 2 FREE",
    delivery: "🚚 Free Delivery",

  },
  {
    id: "garlic",
    title: "Everyday Thins",
    name: "Garlic Flavour",
    flavour: "Garlic",
    image: [everydayGarlicImage, everydayGarlicbackImage],
    description: "A comforting garlic-forward snack for everyday moments.",
    price: "₹640",
    offer: "12-Packet Bundle",
    offerDetails: "🎁 Pay for 10 + Get 2 FREE",
    delivery: "🚚 Free Delivery",
  },
  {
    id: "curry-leaf",
    title: "Everyday Thins",
    name: "Curry Leaf Flavour",
    flavour: "Curry Leaf",
    image: [everydayCurryLeafImage, everydayCurryLeafbackImage],
    description: "A light, flavourful crunch with a herbaceous curry leaf finish.",
    price: "₹640",
    offer: "12-Packet Bundle",
    offerDetails: "🎁 Pay for 10 + Get 2 FREE",
    delivery: "🚚 Free Delivery",
  },
] as const;

export const comboOffer = {
  id: "complete-thins-combo",
  name: "The Complete Thins Combo",
  title: "4 Flavours · 12 Packets",
  flavour: "All 4 Flavours",
  description:
    "Get 3 packets of every WIN-DIA Thins flavour and pay for only 10 packets.",
  flavours: [
    "Moringa",
    "Methi",
    "Jeera",
    "Garlic",
    "Onion",
    "Curry Leaf",
  ],
  image:comboImage,
  price: "₹640",
  offer: "12-Packet Bundle",
  offerDetails: "🎁 Pay for 10 + Get 2 FREE",
  delivery: "🚚 Free Delivery",
  packetCount: 12,
  paidPackets: 10,
  pricePerPacket: 64,
  regularPrice: 768,
  comboPrice: 640,
  savings: 128,
} as const;

type StoreProduct = {
  readonly id: string;
  readonly _id: string;
  readonly slug: string;
  readonly name: string;
  readonly category: string;
  readonly flavor: string;
  readonly description: string;
  readonly price: number;
  readonly image: string | string[];
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

    image: product.image[0].src,

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

  // Handle category as joined object { slug, name } or plain string
  const rawCategory = product.category;
  const category =
    typeof rawCategory === "object" && rawCategory !== null
      ? String((rawCategory as Record<string, unknown>).slug ?? "snacks")
      : String(rawCategory ?? "snacks");

  return {
    id,
    _id: String(product._id ?? id),
    slug: String(product.slug ?? id),
    name: String(product.name ?? "WIN-DIA Product"),
    category,
    flavor: String(product.flavor ?? product.flavour ?? ""),
    description: String(product.description ?? ""),
    price: Number(product.price ?? 0),
    image: String(product.image ?? product.image_url ?? ""),
    countInStock: Number(product.countInStock ?? product.count_in_stock ?? 0),
    netWeight: Number(product.netWeight ?? product.net_weight ?? product.weight ?? 0),
  };
};

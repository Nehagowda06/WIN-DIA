import crunchBitesImage from "@/src/frontend/assets/images/catalogue/crunch-bites.png";
import crispsImage from "@/src/frontend/assets/images/catalogue/crisps.png";
import thinsImage from "@/src/frontend/assets/images/catalogue/thins.png";

export const catalogueItems = [
  { id: "thins", name: "Thins", image: thinsImage },
  { id: "crisps", name: "Crisps", image: crispsImage },
  { id: "crunch-bites", name: "Crunch & Bites", image: crunchBitesImage },
] as const;

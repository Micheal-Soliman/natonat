const STANDARD_FILES = ["1.jpg", "2.jpg", "3.jpg", "4.png", "5.jpg", "6.jpg"] as const;

const OCTOPUS_FOLDERS: Record<string, string> = {
  accord: "Accord",
  anara: "Anaraa",
  andalus: "Andalus",
  ascend: "Ascend",
  azure: "Azure",
  barcelona: "Barcelona",
  black: "Black",
  blush: "Blush",
  dubai: "Dubai",
  "egypt-skyline": "Egypt skyline",
  "egyptian-flag": "Egyptian flag",
  "egyptian-queen": "Egyptian queen",
  "eternal-egypt": "Eternal Egypt",
  explore: "Explore",
  festival: "Festival",
  green: "Green",
  "king-tut": "King TUT",
  lotus: "Lotus",
  lunara: "Lunara",
  madrid: "Madrid",
  "new-york": "new york",
  "optical-illusion": "Optical illusion",
  outdoor: "Outdoor",
  peacock: "Peacock",
  pyramids: "Pyramids",
  red: "Burgundy",
  solora: "solora",
  "tech-explorer": "tech explorer",
  "travel-mosaic": "Travel mosaic",
  "travel-stickers": "Travel stickers",
  "urban-vibes": "Urban vibes",
  valoria: "Valoria",
  vibra: "Virba",
  wildfern: "Wildfern",
};

const FILE_OVERRIDES: Partial<Record<string, readonly string[]>> = {
  accord: ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg"],
  valoria: ["1.jpg", "2.jpg", "3_.jpg", "4.png", "5.jpg", "6.jpg"],
  wildfern: ["1.jpg", "2_.jpg", "3_.jpg", "4.png", "5_.jpg", "6.jpg"],
};

function encodePathSegment(value: string) {
  return encodeURIComponent(value).replaceAll("%2F", "/");
}

export function getOctopusProductImages(slug: string) {
  const normalizedSlug = slug.trim().toLowerCase();
  const folder = OCTOPUS_FOLDERS[normalizedSlug];
  if (!folder) return null;

  const files = FILE_OVERRIDES[normalizedSlug] || STANDARD_FILES;
  return files.map((file) => `/Octopus/${encodePathSegment(folder)}/${encodePathSegment(file)}`);
}

type ProductImageRecord = {
  slug: string;
  image: string;
  images?: string[];
};

export function withLatestOctopusImages<T extends ProductImageRecord>(product: T): T {
  const images = getOctopusProductImages(product.slug);
  if (!images?.length) return product;

  return {
    ...product,
    image: images[0],
    images,
  } as T;
}

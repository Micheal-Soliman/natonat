// Central product catalog for natOnat
// Single source of truth for all product data

export interface Product {
  id: number;
  slug: string;
  name: string;
  category: string;
  size: string | null;
  theme: string;
  price: number;
  originalPrice: number;
  type: string;
  tag: string | null;
  image: string;
  images?: string[];
  color?: string;
  description?: string;
  features?: string[];
  isBundle?: boolean;
  bundleItems?: {
    productId: number;
    quantity: number;
  }[];
}

export const products: Product[] = [
  // Real Products from octopus-photo folder
  { 
    id: 1, 
    slug: "accord",
    name: "ACCORD", 
    category: "luggage-covers", 
    size: "m", 
    theme: "minimal", 
    price: 599, 
    originalPrice: 750, 
    type: "Luggage Cover", 
    tag: "Best Seller", 
    image: "/octopus%20photo/ACCORD/L%20(1).jpg",
    images: [
      "/octopus%20photo/ACCORD/L%20(1).jpg",
      "/octopus%20photo/ACCORD/L%20(2).jpg.jpeg",
      "/octopus%20photo/ACCORD/L%20(3).jpg.jpeg",
      "/octopus%20photo/ACCORD/L%20(4).jpg.jpeg",
      "/octopus%20photo/ACCORD/L%20(5).jpg.jpeg",
      "/octopus%20photo/ACCORD/L%20(6).jpg.jpeg",
      "/octopus%20photo/ACCORD/L%20(7).jpg",
      "/octopus%20photo/ACCORD/L%20(8).jpg",
      "/octopus%20photo/ACCORD/L%20(10).jpg"
    ],
    description: "Modern geometric design for the stylish traveler"
  },
  { 
    id: 2, 
    slug: "anara",
    name: "Anara", 
    category: "luggage-covers", 
    size: "m", 
    theme: "fun", 
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: "New", 
    image: "/octopus%20photo/Anara/021A9163.jpg",
    images: [
      "/octopus%20photo/Anara/021A9155.jpg",
      "/octopus%20photo/Anara/021A9156.jpg",
      "/octopus%20photo/Anara/021A9159.jpg",
      "/octopus%20photo/Anara/021A9160.jpg",
      "/octopus%20photo/Anara/021A9163.jpg",
      "/octopus%20photo/Anara/021A9164.jpg"
    ],
    description: "Beautiful floral pattern to brighten your journey"
  },
  { 
    id: 3, 
    slug: "ascend",
    name: "Ascend", 
    category: "luggage-covers", 
    size: "l", 
    theme: "minimal", 
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Ascend/021A8588.jpg",
    images: [
      "/octopus%20photo/Ascend/021A8588.jpg",
      "/octopus%20photo/Ascend/J%20(5).jpg"
    ],
    description: "Bold abstract design for artistic souls"
  },
  { 
    id: 4, 
    slug: "dubai",
    name: "Dubai", 
    category: "luggage-covers", 
    size: "xl", 
    theme: "travel-icons", 
    price: 749, 
    originalPrice: 900, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Dubai/6%20(2).jpg",
    images: [
      "/octopus%20photo/Dubai/6%20(2).jpg",
      "/octopus%20photo/Dubai/6%20(1).jpg",
      "/octopus%20photo/Dubai/6%20(3).jpg",
      "/octopus%20photo/Dubai/6%20(4).jpg",
      "/octopus%20photo/Dubai/6%20(5).jpg",
      "/octopus%20photo/Dubai/6%20(6).jpg",
      "/octopus%20photo/Dubai/6%20(7).jpg",
      "/octopus%20photo/Dubai/6%20(8).jpg"
    ],
    description: "Inspired by the magnificent city of Dubai"
  },
  { 
    id: 5, 
    slug: "egypt-skyline",
    name: "Egypt Skyline", 
    category: "luggage-covers", 
    size: "m", 
    theme: "travel-icons", 
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Egypt%20Skyline/J%20(1).jpg",
    images: [
      "/octopus%20photo/Egypt%20Skyline/J%20(1).jpg",
      "/octopus%20photo/Egypt%20Skyline/J%20(2).jpg",
      "/octopus%20photo/Egypt%20Skyline/J%20(3).jpg",
      "/octopus%20photo/Egypt%20Skyline/J%20(4).jpg",
      "/octopus%20photo/Egypt%20Skyline/J%20(5).jpg",
      "/octopus%20photo/Egypt%20Skyline/J%20(7).jpg",
      "/octopus%20photo/Egypt%20Skyline/J%20(8).jpg",
      "/octopus%20photo/Egypt%20Skyline/J%20(9).jpg",
      "/octopus%20photo/Egypt%20Skyline/J%20(10).jpg",
      "/octopus%20photo/Egypt%20Skyline/J%20(14).jpg",
      "/octopus%20photo/Egypt%20Skyline/J%20(15).jpg",
      "/octopus%20photo/Egypt%20Skyline/J%20(16).jpg"
    ],
    description: "Celebrating Egypt's iconic landmarks"
  },
  { 
    id: 6, 
    slug: "egyptian-queen",
    name: "Egyptian Queen", 
    category: "luggage-covers", 
    size: "s", 
    theme: "fun", 
    price: 599, 
    originalPrice: 750, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Egyptian%20Queen/D%20(1).jpg",
    images: [
      "/octopus%20photo/Egyptian%20Queen/D%20(1).jpg",
      "/octopus%20photo/Egyptian%20Queen/D%20(2).jpg",
      "/octopus%20photo/Egyptian%20Queen/D%20(3).jpg",
      "/octopus%20photo/Egyptian%20Queen/D%20(5).jpg"
    ],
    description: "Royal Egyptian design for majestic travelers"
  },
  { 
    id: 7, 
    slug: "eternal-egypt",
    name: "Eternal Egypt", 
    category: "luggage-covers", 
    size: "l", 
    theme: "travel-icons", 
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Eternal%20Egypt/i%20(1).jpg",
    images: [
      "/octopus%20photo/Eternal%20Egypt/i%20(1).jpg",
      "/octopus%20photo/Eternal%20Egypt/i%20(2).jpg",
      "/octopus%20photo/Eternal%20Egypt/i%20(3).jpg",
      "/octopus%20photo/Eternal%20Egypt/i%20(4).jpg",
      "/octopus%20photo/Eternal%20Egypt/i%20(5).jpg",
      "/octopus%20photo/Eternal%20Egypt/i%20(6).jpg",
      "/octopus%20photo/Eternal%20Egypt/i%20(7).jpg",
      "/octopus%20photo/Eternal%20Egypt/i%20(8).jpg",
      "/octopus%20photo/Eternal%20Egypt/i%20(9).jpg",
      "/octopus%20photo/Eternal%20Egypt/i%20(10).jpg"
    ],
    description: "Timeless Egyptian heritage design"
  },
  { 
    id: 8, 
    slug: "festival",
    name: "Festival", 
    category: "luggage-covers", 
    size: "m", 
    theme: "fun", 
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Festival/8%20(2).jpg",
    images: [
      "/octopus%20photo/Festival/8%20(2).jpg",
      "/octopus%20photo/Festival/8%20(1).jpg",
      "/octopus%20photo/Festival/8%20(3).jpg",
      "/octopus%20photo/Festival/8%20(4).jpg",
      "/octopus%20photo/Festival/8%20(5).jpg",
      "/octopus%20photo/Festival/8%20(6).jpg",
      "/octopus%20photo/Festival/8%20(7).jpg",
      "/octopus%20photo/Festival/8%20(8).jpg"
    ],
    description: "Vibrant festival colors for joyful travelers"
  },
  { 
    id: 9, 
    slug: "lotus",
    name: "Lotus", 
    category: "luggage-covers", 
    size: "s", 
    theme: "minimal", 
    price: 599, 
    originalPrice: 750, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Lotus/F%20(1).jpg",
    images: [
      "/octopus%20photo/Lotus/F%20(1).jpg",
      "/octopus%20photo/Lotus/F%20(2).jpg"
    ],
    description: "Elegant lotus flower design"
  },
  { 
    id: 10, 
    slug: "lunara",
    name: "Lunara", 
    category: "luggage-covers", 
    size: "l", 
    theme: "fun", 
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Lunara/C%20(1).jpg",
    images: [
      "/octopus%20photo/Lunara/C%20(1).jpg",
      "/octopus%20photo/Lunara/C%20(2).jpg",
      "/octopus%20photo/Lunara/C%20(4).jpg",
      "/octopus%20photo/Lunara/C%20(5).jpg",
      "/octopus%20photo/Lunara/C%20(6).jpg",
      "/octopus%20photo/Lunara/C%20(7).jpg",
      "/octopus%20photo/Lunara/C%20(9).jpg",
      "/octopus%20photo/Lunara/C%20(10).jpg",
      "/octopus%20photo/Lunara/C%20(11).jpg",
      "/octopus%20photo/Lunara/C%20(12).jpg"
    ],
    description: "Mystical lunar-inspired design"
  },
  { 
    id: 11, 
    slug: "new-york",
    name: "New York", 
    category: "luggage-covers", 
    size: "m", 
    theme: "travel-icons", 
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/New%20York/13%20(7).jpg",
    images: [
      "/octopus%20photo/New%20York/13%20(7).jpg",
      "/octopus%20photo/New%20York/13%20(6).jpg"
    ],
    description: "The city that never sleeps design"
  },
  { 
    id: 12, 
    slug: "optical-illusion",
    name: "Optical Illusion", 
    category: "luggage-covers", 
    size: "xl", 
    theme: "fun", 
    price: 749, 
    originalPrice: 900, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Optical%20Illusion/021A7124.jpg",
    images: [
      "/octopus%20photo/Optical%20Illusion/021A7124.jpg",
      "/octopus%20photo/Optical%20Illusion/021A7126.jpg",
      "/octopus%20photo/Optical%20Illusion/021A7130.jpg",
      "/octopus%20photo/Optical%20Illusion/021A7131.jpg",
      "/octopus%20photo/Optical%20Illusion/021A7133.jpg",
      "/octopus%20photo/Optical%20Illusion/021A7135.jpg",
      "/octopus%20photo/Optical%20Illusion/021A7140.jpg",
      "/octopus%20photo/Optical%20Illusion/021A7142.jpg"
    ],
    description: "Mind-bending optical art design"
  },
  { 
    id: 13, 
    slug: "solora",
    name: "Solora", 
    category: "luggage-covers", 
    size: "m", 
    theme: "minimal", 
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Solora/021A9221.jpg",
    images: [
      "/octopus%20photo/Solora/021A9221.jpg",
      "/octopus%20photo/Solora/021A9220.jpg",
      "/octopus%20photo/Solora/021A9222.jpg"
    ],
    description: "Solar-inspired radiant design"
  },
  { 
    id: 14, 
    slug: "travel-mosaic",
    name: "Travel Mosaic", 
    category: "luggage-covers", 
    size: "l", 
    theme: "travel-icons", 
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Travel%20Mosaic/4%20(2).jpg",
    images: [
      "/octopus%20photo/Travel%20Mosaic/4%20(2).jpg",
      "/octopus%20photo/Travel%20Mosaic/4%20(1).jpg",
      "/octopus%20photo/Travel%20Mosaic/4%20(3).jpg",
      "/octopus%20photo/Travel%20Mosaic/4%20(4).jpg"
    ],
    description: "Colorful mosaic of travel memories"
  },
  { 
    id: 15, 
    slug: "king-tut",
    name: "King Tut", 
    category: "luggage-covers", 
    size: "m", 
    theme: "travel-icons", 
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/king%20Tut/B%20(1).jpg",
    images: [
      "/octopus%20photo/king%20Tut/B%20(1).jpg",
      "/octopus%20photo/king%20Tut/B%20(2).jpg",
      "/octopus%20photo/king%20Tut/B%20(3).jpg",
      "/octopus%20photo/king%20Tut/B%20(4).jpg",
      "/octopus%20photo/king%20Tut/B%20(5).jpg",
      "/octopus%20photo/king%20Tut/B%20(6).jpg",
      "/octopus%20photo/king%20Tut/B%20(7).jpg",
      "/octopus%20photo/king%20Tut/B%20(8).jpg"
    ],
    description: "Ancient Egyptian pharaoh inspired design"
  },
  // Bundles
  {
    id: 101,
    slug: "egypt-collection-bundle",
    name: "Egypt Collection Bundle",
    category: "bundles",
    size: null,
    theme: "travel-icons",
    price: 1499,
    originalPrice: 2047,
    type: "Bundle",
    tag: "Best Seller",
    image: "/octopus%20photo/Egyptian%20Queen/D%20(1).jpg",
    images: [
      "/octopus%20photo/Egyptian%20Queen/D%20(1).jpg",
      "/octopus%20photo/Egypt%20Skyline/J%20(1).jpg",
      "/octopus%20photo/king%20Tut/B%20(1).jpg"
    ],
    description: "Complete Egypt collection with 3 premium luggage covers",
    isBundle: true,
    bundleItems: [
      { productId: 6, quantity: 1 },
      { productId: 5, quantity: 1 },
      { productId: 15, quantity: 1 }
    ],
    features: ["3 Egyptian-themed covers", "Mix of sizes", "Save 27%", "Free gift box"]
  },
  {
    id: 102,
    slug: "travel-duo-bundle",
    name: "Travel Duo Bundle",
    category: "bundles",
    size: null,
    theme: "minimal",
    price: 1099,
    originalPrice: 1348,
    type: "Bundle",
    tag: "New",
    image: "/octopus%20photo/ACCORD/L%20(1).jpg",
    images: [
      "/octopus%20photo/ACCORD/L%20(1).jpg",
      "/octopus%20photo/Solora/021A9220.jpg"
    ],
    description: "Perfect pair for couples - 2 modern minimal covers",
    isBundle: true,
    bundleItems: [
      { productId: 1, quantity: 1 },
      { productId: 13, quantity: 1 }
    ],
    features: ["2 Minimal designs", "Perfect for couples", "Save 18%", "Matching set"]
  },
  {
    id: 103,
    slug: "world-traveler-bundle",
    name: "World Traveler Bundle",
    category: "bundles",
    size: null,
    theme: "travel-icons",
    price: 1799,
    originalPrice: 2396,
    type: "Bundle",
    tag: null,
    image: "/octopus%20photo/Dubai/6%20(1).jpg",
    images: [
      "/octopus%20photo/Dubai/6%20(1).jpg",
      "/octopus%20photo/New%20York/13%20(6).jpg",
      "/octopus%20photo/Travel%20Mosaic/4%20(1).jpg"
    ],
    description: "Explore the world with city-themed covers",
    isBundle: true,
    bundleItems: [
      { productId: 4, quantity: 1 },
      { productId: 11, quantity: 1 },
      { productId: 14, quantity: 1 }
    ],
    features: ["3 City designs", "Dubai, New York & Mosaic", "Save 25%", "Travel in style"]
  },
  {
    id: 104,
    slug: "family-fun-bundle",
    name: "Family Fun Bundle",
    category: "bundles",
    size: null,
    theme: "fun",
    price: 1699,
    originalPrice: 2146,
    type: "Bundle",
    tag: null,
    image: "/octopus%20photo/Festival/8%20(1).jpg",
    images: [
      "/octopus%20photo/Festival/8%20(1).jpg",
      "/octopus%20photo/Lunara/C%20(1).jpg",
      "/octopus%20photo/Optical%20Illusion/021A7124.jpg"
    ],
    description: "Colorful and fun collection for the whole family",
    isBundle: true,
    bundleItems: [
      { productId: 8, quantity: 1 },
      { productId: 10, quantity: 1 },
      { productId: 12, quantity: 1 }
    ],
    features: ["3 Fun colorful designs", "Different sizes", "Save 21%", "Family vacation ready"]
  },
];

// Helper functions
export const getProductById = (id: number): Product | undefined => {
  return products.find(p => p.id === id);
};

export const getProductBySlug = (slug: string): Product | undefined => {
  return products.find(p => p.slug === slug);
};

export const getProductsByCategory = (category: string): Product[] => {
  return products.filter(p => p.category === category);
};

export const getLuggageCovers = (): Product[] => {
  return products.filter(p => p.category === "luggage-covers");
};

export const getPassportWallets = (): Product[] => {
  return products.filter(p => p.category === "passport-wallets");
};

export const getBundles = (): Product[] => {
  return products.filter(p => p.category === "bundles");
};

// Product metadata
export const sizes = [
  { id: "s", label: "S", range: "45-53 cm", height: "Carry-on" },
  { id: "m", label: "M", range: "55-63 cm", height: "Medium" },
  { id: "l", label: "L", range: "65-74 cm", height: "Large" },
  { id: "xl", label: "XL", range: "76-81 cm", height: "Extra Large" },
];

export const themes = [
  { id: "minimal", label: "Minimal" },
  { id: "fun", label: "Fun & Colorful" },
  { id: "travel-icons", label: "Travel Icons" },
];

export const categories = [
  { id: "all", label: "All Products" },
  { id: "bundles", label: "Bundles & Sets" },
  { id: "luggage-covers", label: "Luggage Covers" },
  { id: "passport-wallets", label: "Passport Wallets" },
];

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
  color?: string;
  description?: string;
  features?: string[];
}

export const products: Product[] = [
  // Real Products from octopus photo folder
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
    image: "/octopus photo/ACCORD/L (1).jpg",
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
    image: "/octopus photo/Anara/021A9155.jpg",
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
    image: "/octopus photo/Ascend/021A8588.jpg",
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
    image: "/octopus photo/Dubai/6 (1).jpg",
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
    image: "/octopus photo/Egypt Skyline/J (1).jpg",
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
    image: "/octopus photo/Egyptian Queen/D (1).jpg",
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
    image: "/octopus photo/Eternal Egypt/i (1).jpg",
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
    image: "/octopus photo/Festival/8 (1).jpg",
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
    image: "/octopus photo/Lotus/F (1).jpg",
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
    image: "/octopus photo/Lunara/C (1).jpg",
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
    image: "/octopus photo/New York/13 (6).jpg",
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
    image: "/octopus photo/Optical Illusion/021A7124.jpg",
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
    image: "/octopus photo/Solora/021A9220.jpg",
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
    image: "/octopus photo/Travel Mosaic/4 (1).jpg",
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
    image: "/octopus photo/king Tut/B (1).jpg",
    description: "Ancient Egyptian pharaoh inspired design"
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

export const getTravelSets = (): Product[] => {
  return products.filter(p => p.category === "travel-sets");
};

// Product metadata
export const sizes = [
  { id: "s", label: "S", range: "18-21 inches", height: "Carry-on" },
  { id: "m", label: "M", range: "22-25 inches", height: "Medium" },
  { id: "l", label: "L", range: "26-29 inches", height: "Large" },
  { id: "xl", label: "XL", range: "30-32 inches", height: "Extra Large" },
];

export const themes = [
  { id: "minimal", label: "Minimal" },
  { id: "fun", label: "Fun & Colorful" },
  { id: "travel-icons", label: "Travel Icons" },
  { id: "kids", label: "Kids" },
];

export const categories = [
  { id: "all", label: "All Products" },
  { id: "luggage-covers", label: "Luggage Covers" },
  { id: "passport-wallets", label: "Passport Wallets" },
  { id: "travel-sets", label: "Travel Sets" },
];

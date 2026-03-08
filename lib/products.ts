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
  // Luggage Covers
  { 
    id: 1, 
    slug: "geo-print-cover",
    name: "Geo Print Cover", 
    category: "luggage-covers", 
    size: "s", 
    theme: "minimal", 
    price: 599, 
    originalPrice: 750, 
    type: "Luggage Cover", 
    tag: "Best Seller", 
    image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=600&q=80",
    description: "Modern geometric design for the stylish traveler"
  },
  { 
    id: 2, 
    slug: "floral-design-cover",
    name: "Floral Design Cover", 
    category: "luggage-covers", 
    size: "m", 
    theme: "fun", 
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: "New", 
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
    description: "Beautiful floral pattern to brighten your journey"
  },
  { 
    id: 4, 
    slug: "abstract-art-cover",
    name: "Abstract Art Cover", 
    category: "luggage-covers", 
    size: "l", 
    theme: "fun", 
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: null, 
    image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600&q=80",
    description: "Bold abstract design for artistic souls"
  },
  { 
    id: 6, 
    slug: "minimal-cover-xl",
    name: "Minimal Cover - XL", 
    category: "luggage-covers", 
    size: "xl", 
    theme: "minimal", 
    price: 749, 
    originalPrice: 900, 
    type: "Luggage Cover", 
    tag: null, 
    image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=600&q=80",
    description: "Clean minimal design for extra large suitcases"
  },
  { 
    id: 7, 
    slug: "airplane-pattern-cover",
    name: "Airplane Pattern Cover", 
    category: "luggage-covers", 
    size: "m", 
    theme: "travel-icons", 
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80",
    description: "Perfect for aviation enthusiasts"
  },
  { 
    id: 8, 
    slug: "cartoon-animals-cover",
    name: "Cartoon Animals Cover", 
    category: "luggage-covers", 
    size: "s", 
    theme: "kids", 
    price: 599, 
    originalPrice: 750, 
    type: "Luggage Cover", 
    tag: null, 
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80",
    description: "Fun cartoon characters for kids' luggage"
  },
  { 
    id: 11, 
    slug: "tropical-print-cover",
    name: "Tropical Print Cover", 
    category: "luggage-covers", 
    size: "l", 
    theme: "fun", 
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: null, 
    image: "https://images.unsplash.com/photo-1559628233-100c798642d4?w=600&q=80",
    description: "Tropical vibes for your beach vacation"
  },
  { 
    id: 12, 
    slug: "world-map-cover",
    name: "World Map Cover", 
    category: "luggage-covers", 
    size: "m", 
    theme: "travel-icons", 
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=80",
    description: "World map design for the globetrotter"
  },
  
  // Passport Wallets
  { 
    id: 3, 
    slug: "classic-leather-wallet",
    name: "Classic Leather Wallet", 
    category: "passport-wallets", 
    size: null, 
    theme: "minimal", 
    price: 449, 
    originalPrice: 550, 
    type: "Passport Wallet", 
    tag: null, 
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80",
    description: "Classic brown leather passport wallet",
    features: ["Premium leather", "4 card slots", "Passport pocket"],
    color: "Brown"
  },
  { 
    id: 9, 
    slug: "rfid-premium-wallet",
    name: "RFID Premium Wallet", 
    category: "passport-wallets", 
    size: null, 
    theme: "minimal", 
    price: 549, 
    originalPrice: 700, 
    type: "Passport Wallet", 
    tag: "RFID", 
    image: "https://images.unsplash.com/photo-1606503825008-909a6184ad54?w=600&q=80",
    description: "Advanced RFID protection for your documents",
    features: ["RFID protection", "6 card slots", "SIM card holder"],
    color: "Black"
  },
  { 
    id: 101, 
    slug: "slim-travel-wallet",
    name: "Slim Travel Wallet", 
    category: "passport-wallets", 
    size: null, 
    theme: "minimal", 
    price: 399, 
    originalPrice: 500, 
    type: "Passport Wallet", 
    tag: null, 
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
    description: "Slim and lightweight travel companion",
    features: ["Minimal design", "3 card slots", "Boarding pass slot"],
    color: "Grey"
  },
  { 
    id: 102, 
    slug: "family-passport-wallet",
    name: "Family Passport Wallet", 
    category: "passport-wallets", 
    size: null, 
    theme: "minimal", 
    price: 649, 
    originalPrice: 800, 
    type: "Passport Wallet", 
    tag: "Family", 
    image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600&q=80",
    description: "Holds up to 4 passports for family trips",
    features: ["4 passports", "Document organizer", "Zip closure"],
    color: "Blue"
  },
  { 
    id: 103, 
    slug: "deluxe-travel-organizer",
    name: "Deluxe Travel Organizer", 
    category: "passport-wallets", 
    size: null, 
    theme: "minimal", 
    price: 749, 
    originalPrice: 950, 
    type: "Passport Wallet", 
    tag: "Premium", 
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80",
    description: "Premium leather with all features included",
    features: ["Premium leather", "RFID protection", "Pen holder", "Coin pocket"],
    color: "Brown"
  },
  { 
    id: 104, 
    slug: "compact-card-holder",
    name: "Compact Card Holder", 
    category: "passport-wallets", 
    size: null, 
    theme: "minimal", 
    price: 299, 
    originalPrice: 400, 
    type: "Passport Wallet", 
    tag: null, 
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80",
    description: "Ultra slim card and passport holder",
    features: ["Slim profile", "5 card slots", "Cash pocket"],
    color: "Black"
  },
  
  // Travel Sets / Bundles
  { 
    id: 5, 
    slug: "travel-set-geo",
    name: "Travel Set - Geo", 
    category: "travel-sets", 
    size: "m", 
    theme: "minimal", 
    price: 899, 
    originalPrice: 1150, 
    type: "Bundle", 
    tag: "Save 20%", 
    image: "https://images.unsplash.com/photo-1504198458649-3128b932f49e?w=600&q=80",
    description: "Complete set with luggage cover and wallet"
  },
  { 
    id: 10, 
    slug: "family-pack",
    name: "Family Pack", 
    category: "travel-sets", 
    size: null, 
    theme: "fun", 
    price: 2999, 
    originalPrice: 4200, 
    type: "Bundle", 
    tag: "Bundle", 
    image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=600&q=80",
    description: "Everything for the whole family"
  },
  { 
    id: 105, 
    slug: "solo-traveler-set",
    name: "Solo Traveler Set", 
    category: "travel-sets", 
    size: "m", 
    theme: "minimal", 
    price: 899, 
    originalPrice: 1050, 
    type: "Bundle", 
    tag: "Save", 
    image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=600&q=80",
    description: "1 Cover + 1 Passport Wallet"
  },
  { 
    id: 106, 
    slug: "couples-bundle",
    name: "Couple's Bundle", 
    category: "travel-sets", 
    size: "m", 
    theme: "minimal", 
    price: 1699, 
    originalPrice: 2100, 
    type: "Bundle", 
    tag: "Save", 
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
    description: "2 Covers + 2 Wallets for couples"
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

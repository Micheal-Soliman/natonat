// Central product catalog for natOnat
// Single source of truth for all product data

export interface Product {
  id: number;
  slug: string;
  name: string;
  category: string | string[];
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
    productId?: number;
    productIds?: number[];
    quantity: number;
    label?: string;
  }[];
  sizePrices?: {
    s: { price: number; originalPrice: number };
    m: { price: number; originalPrice: number };
    l: { price: number; originalPrice: number };
    xl: { price: number; originalPrice: number };
  };
  colors?: {
    id: string;
    name: string;
    image: string;
  }[];
  // New filter fields for luggage covers
  gender?: "male" | "female" | "unisex" | ("male" | "female" | "unisex")[];
  collection?: "sports" | "pharaoh" | null;
  printType?: "plain" | "printed";
  // Dynamic pricing for bundles
  dynamicPricing?: boolean;
  pricingRule?: string;
}

export const products: Product[] = [
  // Real Products from octopus-photo folder
  {
    id: 1,
    slug: "accord",
    name: "ACCORD",
    category: "luggage-covers",
    size: "m",
    gender: "unisex",
    collection: null,
    printType: "printed",
    theme: "minimal",
    color: "Black & White",
    price: 599,
    originalPrice: 750,
    type: "Luggage Cover",
    tag: null,
    image: "/octopus%20photo/ACCORD/1.png",
    images: [
      "/octopus%20photo/ACCORD/1.png",
      "/octopus%20photo/ACCORD/2.webp",
      "/octopus%20photo/ACCORD/3.webp",
      "/octopus%20photo/ACCORD/4.webp",
      "/octopus%20photo/ACCORD/5.webp",
      "/octopus%20photo/ACCORD/6.webp"
    ],
    description: "Modern geometric design for the stylish traveler",
    sizePrices: {
      s: { price: 589, originalPrice: 700 },
      m: { price: 649, originalPrice: 750 },
      l: { price: 689, originalPrice: 800 },
      xl: { price: 749, originalPrice: 850 }
    }
  },
  { 
    id: 2, 
    slug: "anara",
    name: "Anara", 
    category: "luggage-covers", 
    size: "m",
    gender: "female",
    collection: "pharaoh",
    printType: "printed",
    theme: "fun", 
    color: "Blue & Gold",
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Anara/1.png",
    images: [
      "/octopus%20photo/Anara/1.png",
      "/octopus%20photo/Anara/2.webp",
      "/octopus%20photo/Anara/3.webp",
      "/octopus%20photo/Anara/4.webp",
      "/octopus%20photo/Anara/5.webp",
      "/octopus%20photo/Anara/6.webp"
    ],
    description: "Beautiful floral pattern to brighten your journey",
    sizePrices: {
      s: { price: 589, originalPrice: 750 },
      m: { price: 649, originalPrice: 800 },
      l: { price: 689, originalPrice: 850 },
      xl: { price: 749, originalPrice: 900 }
    }
  },
  { 
    id: 3, 
    slug: "ascend",
    name: "Ascend", 
    category: "luggage-covers", 
    size: "l",
    gender: "unisex",
    collection: null,
    printType: "printed",
    theme: "minimal", 
    color: "Blue",
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Ascend/1.png",
    images: [
      "/octopus%20photo/Ascend/1.png",
      "/octopus%20photo/Ascend/2.webp",
      "/octopus%20photo/Ascend/3.webp",
      "/octopus%20photo/Ascend/4.webp",
      "/octopus%20photo/Ascend/5.webp",
      "/octopus%20photo/Ascend/6.webp"
    ],
    description: "Bold abstract design for artistic souls",
    sizePrices: {
      s: { price: 589, originalPrice: 800 },
      m: { price: 649, originalPrice: 850 },
      l: { price: 689, originalPrice: 900 },
      xl: { price: 749, originalPrice: 950 }
    }
  },
  { 
    id: 4, 
    slug: "dubai",
    name: "Dubai", 
    category: "luggage-covers", 
    size: "xl",
    gender: "unisex",
    collection: null,
    printType: "printed",
    theme: "travel-icons", 
    color: "Blue",
    price: 749, 
    originalPrice: 900, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Dubai/1.png",
    images: [
      "/octopus%20photo/Dubai/1.png",
      "/octopus%20photo/Dubai/2.webp",
      "/octopus%20photo/Dubai/3.webp",
      "/octopus%20photo/Dubai/4.webp",
      "/octopus%20photo/Dubai/5.webp",
      "/octopus%20photo/Dubai/6.webp"
    ],
    description: "Inspired by the magnificent city of Dubai",
    sizePrices: {
      s: { price: 589, originalPrice: 850 },
      m: { price: 649, originalPrice: 900 },
      l: { price: 689, originalPrice: 950 },
      xl: { price: 749, originalPrice: 1000 }
    }
  },
  { 
    id: 5, 
    slug: "egypt-skyline",
    name: "Egypt Skyline", 
    category: "luggage-covers", 
    size: "m",
    gender: "unisex",
    collection: "pharaoh",
    printType: "printed",
    theme: "travel-icons", 
    color: "Blue",
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Egypt%20Skyline/1.png",
    images: [
      "/octopus%20photo/Egypt%20Skyline/1.png",
      "/octopus%20photo/Egypt%20Skyline/2.webp",
      "/octopus%20photo/Egypt%20Skyline/3.webp",
      "/octopus%20photo/Egypt%20Skyline/4.webp",
      "/octopus%20photo/Egypt%20Skyline/5.webp",
      "/octopus%20photo/Egypt%20Skyline/6.webp"
    ],
    description: "Celebrating Egypt's iconic landmarks",
    sizePrices: {
      s: { price: 589, originalPrice: 750 },
      m: { price: 649, originalPrice: 800 },
      l: { price: 689, originalPrice: 850 },
      xl: { price: 749, originalPrice: 900 }
    }
  },
  { 
    id: 6, 
    slug: "egyptian-queen",
    name: "Egyptian Queen", 
    category: "luggage-covers", 
    size: "s",
    gender: "female",
    collection: "pharaoh",
    printType: "printed",
    theme: "fun", 
    color: "Gold",
    price: 599, 
    originalPrice: 750, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Egyptian%20Queen/1.png",
    images: [
      "/octopus%20photo/Egyptian%20Queen/1.png",
      "/octopus%20photo/Egyptian%20Queen/2.webp",
      "/octopus%20photo/Egyptian%20Queen/3.webp",
      "/octopus%20photo/Egyptian%20Queen/4.webp",
      "/octopus%20photo/Egyptian%20Queen/5.webp",
      "/octopus%20photo/Egyptian%20Queen/6.webp"
    ],
    description: "Royal Egyptian design for majestic travelers",
    sizePrices: {
      s: { price: 589, originalPrice: 700 },
      m: { price: 649, originalPrice: 750 },
      l: { price: 689, originalPrice: 800 },
      xl: { price: 749, originalPrice: 850 }
    }
  },
  { 
    id: 7, 
    slug: "eternal-egypt",
    name: "Eternal Egypt", 
    category: "luggage-covers", 
    size: "l",
    gender: "unisex",
    collection: "pharaoh",
    printType: "printed",
    theme: "travel-icons", 
    color: "Blue",
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Eternal%20Egypt/1.png",
    images: [
      "/octopus%20photo/Eternal%20Egypt/1.png",
      "/octopus%20photo/Eternal%20Egypt/2.webp",
      "/octopus%20photo/Eternal%20Egypt/3.webp",
      "/octopus%20photo/Eternal%20Egypt/4.webp",
      "/octopus%20photo/Eternal%20Egypt/5.webp",
      "/octopus%20photo/Eternal%20Egypt/6.webp"
    ],
    description: "Timeless Egyptian heritage design",
    sizePrices: {
      s: { price: 589, originalPrice: 800 },
      m: { price: 649, originalPrice: 850 },
      l: { price: 689, originalPrice: 900 },
      xl: { price: 749, originalPrice: 950 }
    }
  },
  { 
    id: 8, 
    slug: "festival",
    name: "Festival", 
    category: "luggage-covers", 
    size: "m",
    gender: "female",
    collection: null,
    printType: "printed",
    theme: "fun", 
    color: "Colorful",
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Festival/1.png",
    images: [
      "/octopus%20photo/Festival/1.png",
      "/octopus%20photo/Festival/2.webp",
      "/octopus%20photo/Festival/3.webp",
      "/octopus%20photo/Festival/4.webp",
      "/octopus%20photo/Festival/5.webp",
      "/octopus%20photo/Festival/6.webp"
    ],
    description: "Vibrant festival colors for joyful travelers",
    sizePrices: {
      s: { price: 589, originalPrice: 750 },
      m: { price: 649, originalPrice: 800 },
      l: { price: 689, originalPrice: 850 },
      xl: { price: 749, originalPrice: 900 }
    }
  },
  { 
    id: 9, 
    slug: "lotus",
    name: "Lotus", 
    category: "luggage-covers", 
    size: "s",
    gender: "unisex",
    collection: "pharaoh",
    printType: "printed",
    theme: "minimal", 
    color: "Gold",
    price: 599, 
    originalPrice: 750, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Lotus/1.png",
    images: [
      "/octopus%20photo/Lotus/1.png",
      "/octopus%20photo/Lotus/2.webp",
      "/octopus%20photo/Lotus/3.webp",
      "/octopus%20photo/Lotus/4.webp",
      "/octopus%20photo/Lotus/5.webp",
      "/octopus%20photo/Lotus/6.webp"
    ],
    description: "Elegant lotus flower design",
    sizePrices: {
      s: { price: 589, originalPrice: 700 },
      m: { price: 649, originalPrice: 750 },
      l: { price: 689, originalPrice: 800 },
      xl: { price: 749, originalPrice: 850 }
    }
  },
  { 
    id: 10, 
    slug: "lunara",
    name: "Lunara", 
    category: "luggage-covers", 
    size: "l",
    gender: "female",
    collection: null,
    printType: "printed",
    theme: "fun", 
    color: "Navy Blue",
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Lunara/1.png",
    images: [
      "/octopus%20photo/Lunara/1.png",
      "/octopus%20photo/Lunara/2.webp",
      "/octopus%20photo/Lunara/3.webp",
      "/octopus%20photo/Lunara/4.webp",
      "/octopus%20photo/Lunara/5.webp",
      "/octopus%20photo/Lunara/6.webp"
    ],
    description: "Mystical lunar-inspired design",
    sizePrices: {
      s: { price: 589, originalPrice: 800 },
      m: { price: 649, originalPrice: 850 },
      l: { price: 689, originalPrice: 900 },
      xl: { price: 749, originalPrice: 950 }
    }
  },
  { 
    id: 11, 
    slug: "new-york",
    name: "New York", 
    category: "luggage-covers", 
    size: "m",
    gender: "female",
    collection: null,
    printType: "printed",
    theme: "travel-icons", 
    color: "Grey",
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/New%20York/1.png",
    images: [
      "/octopus%20photo/New%20York/1.png",
      "/octopus%20photo/New%20York/2.webp",
      "/octopus%20photo/New%20York/3.webp",
      "/octopus%20photo/New%20York/4.webp",
      "/octopus%20photo/New%20York/5.webp",
      "/octopus%20photo/New%20York/6.webp"
    ],
    description: "The city that never sleeps design",
    sizePrices: {
      s: { price: 589, originalPrice: 750 },
      m: { price: 649, originalPrice: 800 },
      l: { price: 689, originalPrice: 850 },
      xl: { price: 749, originalPrice: 900 }
    }
  },
  { 
    id: 12, 
    slug: "optical-illusion",
    name: "Optical Illusion", 
    category: "luggage-covers", 
    size: "xl",
    gender: "unisex",
    collection: null,
    printType: "printed",
    theme: "fun", 
    color: "Black & White",
    price: 749, 
    originalPrice: 900, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Optical%20Illusion/1.png",
    images: [
      "/octopus%20photo/Optical%20Illusion/1.png",
      "/octopus%20photo/Optical%20Illusion/2.webp",
      "/octopus%20photo/Optical%20Illusion/3.webp",
      "/octopus%20photo/Optical%20Illusion/4.webp",
      "/octopus%20photo/Optical%20Illusion/5.webp",
      "/octopus%20photo/Optical%20Illusion/6.webp"
    ],
    description: "Mind-bending optical art design",
    sizePrices: {
      s: { price: 589, originalPrice: 850 },
      m: { price: 649, originalPrice: 900 },
      l: { price: 689, originalPrice: 950 },
      xl: { price: 749, originalPrice: 1000 }
    }
  },
  { 
    id: 13, 
    slug: "solora",
    name: "Solora", 
    category: "luggage-covers", 
    size: "m",
    gender: "female",
    collection: null,
    printType: "printed",
    theme: "minimal", 
    color: "Yellow",
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Solora/1.png",
    images: [
      "/octopus%20photo/Solora/1.png",
      "/octopus%20photo/Solora/2.webp",
      "/octopus%20photo/Solora/3.webp",
      "/octopus%20photo/Solora/4.webp",
      "/octopus%20photo/Solora/5.webp",
      "/octopus%20photo/Solora/6.webp"
    ],
    description: "Solar-inspired radiant design",
    sizePrices: {
      s: { price: 589, originalPrice: 750 },
      m: { price: 649, originalPrice: 800 },
      l: { price: 689, originalPrice: 850 },
      xl: { price: 749, originalPrice: 900 }
    }
  },
  { 
    id: 14, 
    slug: "travel-mosaic",
    name: "Travel Mosaic", 
    category: "luggage-covers", 
    size: "l",
    gender: "female",
    collection: null,
    printType: "printed",
    theme: "travel-icons", 
    color: "Blue",
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Travel%20Mosaic/1.png",
    images: [
      "/octopus%20photo/Travel%20Mosaic/1.png",
      "/octopus%20photo/Travel%20Mosaic/2.webp",
      "/octopus%20photo/Travel%20Mosaic/3.webp",
      "/octopus%20photo/Travel%20Mosaic/4.webp",
      "/octopus%20photo/Travel%20Mosaic/5.webp",
      "/octopus%20photo/Travel%20Mosaic/6.webp"
    ],
    description: "Colorful mosaic of travel memories",
    sizePrices: {
      s: { price: 589, originalPrice: 800 },
      m: { price: 649, originalPrice: 850 },
      l: { price: 689, originalPrice: 900 },
      xl: { price: 749, originalPrice: 950 }
    }
  },
  { 
    id: 15, 
    slug: "king-tut",
    name: "King Tut", 
    category: "luggage-covers", 
    size: "m",
    gender: "male",
    collection: "pharaoh",
    printType: "printed",
    theme: "travel-icons", 
    color: "Blue & Gold",
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/king%20Tut/1.png",
    images: [
      "/octopus%20photo/king%20Tut/1.png",
      "/octopus%20photo/king%20Tut/2.webp",
      "/octopus%20photo/king%20Tut/3.webp",
      "/octopus%20photo/king%20Tut/4.webp",
      "/octopus%20photo/king%20Tut/5.webp",
      "/octopus%20photo/king%20Tut/6.webp"
    ],
    description: "Ancient Egyptian pharaoh inspired design",
    sizePrices: {
      s: { price: 589, originalPrice: 750 },
      m: { price: 649, originalPrice: 800 },
      l: { price: 689, originalPrice: 850 },
      xl: { price: 749, originalPrice: 900 }
    }
  },
  { 
    id: 16, 
    slug: "black",
    name: "Black", 
    category: "luggage-covers", 
    size: "m",
    gender: "unisex",
    collection: null,
    printType: "plain",
    theme: "minimal", 
    color: "Black",
    price: 599, 
    originalPrice: 750, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Black/1.png",
    images: [
      "/octopus%20photo/Black/1.png",
      "/octopus%20photo/Black/2.webp",
      "/octopus%20photo/Black/3.webp",
      "/octopus%20photo/Black/4.webp",
      "/octopus%20photo/Black/5.webp",
      "/octopus%20photo/Black/6.webp"
    ],
    description: "Classic black design for sophisticated travelers",
    sizePrices: {
      s: { price: 589, originalPrice: 700 },
      m: { price: 649, originalPrice: 750 },
      l: { price: 689, originalPrice: 800 },
      xl: { price: 749, originalPrice: 850 }
    }
  },
  { 
    id: 17, 
    slug: "explore",
    name: "Explore", 
    category: "luggage-covers", 
    size: "l",
    gender: "male",
    collection: null,
    printType: "printed",
    theme: "travel-icons", 
    color: "Blue",
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Explore/1.png",
    images: [
      "/octopus%20photo/Explore/1.png",
      "/octopus%20photo/Explore/2.webp",
      "/octopus%20photo/Explore/3.webp",
      "/octopus%20photo/Explore/4.webp",
      "/octopus%20photo/Explore/5.webp",
      "/octopus%20photo/Explore/6.webp"
    ],
    description: "Adventure awaits with this exploration-inspired design",
    sizePrices: {
      s: { price: 589, originalPrice: 800 },
      m: { price: 649, originalPrice: 850 },
      l: { price: 689, originalPrice: 900 },
      xl: { price: 749, originalPrice: 950 }
    }
  },
  { 
    id: 18, 
    slug: "outdoor",
    name: "Outdoor", 
    category: "luggage-covers", 
    size: "s",
    gender: "unisex",
    collection: null,
    printType: "printed",
    theme: "minimal", 
    color: "Green",
    price: 549, 
    originalPrice: 700, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Outdoor/1.png",
    images: [
      "/octopus%20photo/Outdoor/1.png",
      "/octopus%20photo/Outdoor/2.webp",
      "/octopus%20photo/Outdoor/3.webp",
      "/octopus%20photo/Outdoor/4.webp",
      "/octopus%20photo/Outdoor/5.webp",
      "/octopus%20photo/Outdoor/6.webp"
    ],
    description: "Nature-inspired design for outdoor enthusiasts",
    sizePrices: {
      s: { price: 589, originalPrice: 650 },
      m: { price: 649, originalPrice: 700 },
      l: { price: 689, originalPrice: 750 },
      xl: { price: 749, originalPrice: 800 }
    }
  },
  { 
    id: 19, 
    slug: "travel-stickers",
    name: "Travel Stickers", 
    category: "luggage-covers", 
    size: "m",
    gender: "unisex",
    collection: null,
    printType: "printed",
    theme: "travel-icons", 
    color: "Blue",
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Travel%20Stickers/1.png",
    images: [
      "/octopus%20photo/Travel%20Stickers/1.png",
      "/octopus%20photo/Travel%20Stickers/2.webp",
      "/octopus%20photo/Travel%20Stickers/3.webp",
      "/octopus%20photo/Travel%20Stickers/4.webp",
      "/octopus%20photo/Travel%20Stickers/5.webp",
      "/octopus%20photo/Travel%20Stickers/6.webp"
    ],
    description: "Colorful travel stickers design for wanderlust souls",
    sizePrices: {
      s: { price: 589, originalPrice: 750 },
      m: { price: 649, originalPrice: 800 },
      l: { price: 689, originalPrice: 850 },
      xl: { price: 749, originalPrice: 900 }
    }
  },
  { 
    id: 20, 
    slug: "urban-vibes",
    name: "Urban Vibes", 
    category: "luggage-covers", 
    size: "l",
    gender: "unisex",
    collection: null,
    printType: "printed",
    theme: "minimal", 
    color: "Black",
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: "Best Seller", 
    image: "/octopus%20photo/Urban%20Vibes/1.png",
    images: [
      "/octopus%20photo/Urban%20Vibes/1.png",
      "/octopus%20photo/Urban%20Vibes/2.webp",
      "/octopus%20photo/Urban%20Vibes/3.webp",
      "/octopus%20photo/Urban%20Vibes/4.webp",
      "/octopus%20photo/Urban%20Vibes/5.webp",
      "/octopus%20photo/Urban%20Vibes/6.webp"
    ],
    description: "Modern urban aesthetic for city travelers",
    sizePrices: {
      s: { price: 589, originalPrice: 800 },
      m: { price: 649, originalPrice: 850 },
      l: { price: 689, originalPrice: 900 },
      xl: { price: 749, originalPrice: 950 }
    }
  },
  { 
    id: 21, 
    slug: "valoria",
    name: "Valoria", 
    category: "luggage-covers", 
    size: "m",
    gender: "female",
    collection: null,
    printType: "printed",
    theme: "fun", 
    color: "Purple",
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Valoria/1.png",
    images: [
      "/octopus%20photo/Valoria/1.png",
      "/octopus%20photo/Valoria/2.webp",
      "/octopus%20photo/Valoria/3.webp",
      "/octopus%20photo/Valoria/4.webp",
      "/octopus%20photo/Valoria/5.webp",
      "/octopus%20photo/Valoria/6.webp"
    ],
    description: "Bold and vibrant design for confident travelers",
    sizePrices: {
      s: { price: 589, originalPrice: 750 },
      m: { price: 649, originalPrice: 800 },
      l: { price: 689, originalPrice: 850 },
      xl: { price: 749, originalPrice: 900 }
    }
  },
  { 
    id: 22, 
    slug: "barcelona",
    name: "Barcelona", 
    category: "luggage-covers", 
    size: "m",
    gender: ["male", "female"],
    collection: "sports",
    printType: "printed",
    theme: "travel-icons", 
    color: "Blue & Red",
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: "New", 
    image: "/octopus%20photo/Barcelona/1.png",
    images: [
      "/octopus%20photo/Barcelona/1.png",
      "/octopus%20photo/Barcelona/2.webp",
      "/octopus%20photo/Barcelona/3.webp",
      "/octopus%20photo/Barcelona/4.webp",
      "/octopus%20photo/Barcelona/5.webp",
      "/octopus%20photo/Barcelona/6.webp"
    ],
    description: "Vibrant Barcelona-inspired design for passionate travelers",
    sizePrices: {
      s: { price: 589, originalPrice: 750 },
      m: { price: 649, originalPrice: 800 },
      l: { price: 689, originalPrice: 850 },
      xl: { price: 749, originalPrice: 900 }
    }
  },
  { 
    id: 23, 
    slug: "madrid",
    name: "Madrid", 
    category: "luggage-covers", 
    size: "l",
    gender: ["male", "female"],
    collection: "sports",
    printType: "printed",
    theme: "travel-icons", 
    color: "White",
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Madrid/1.png",
    images: [
      "/octopus%20photo/Madrid/1.png",
      "/octopus%20photo/Madrid/2.webp",
      "/octopus%20photo/Madrid/3.webp",
      "/octopus%20photo/Madrid/4.webp",
      "/octopus%20photo/Madrid/5.webp",
      "/octopus%20photo/Madrid/6.webp"
    ],
    description: "Elegant Madrid design celebrating Spanish culture",
    sizePrices: {
      s: { price: 589, originalPrice: 800 },
      m: { price: 649, originalPrice: 850 },
      l: { price: 689, originalPrice: 900 },
      xl: { price: 749, originalPrice: 950 }
    }
  },
  { 
    id: 24, 
    slug: "peacock",
    name: "Peacock", 
    category: "luggage-covers", 
    size: "m",
    gender: "unisex",
    collection: null,
    printType: "printed",
    theme: "fun", 
    color: "Green & Blue",
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: "New", 
    image: "/octopus%20photo/Peacock/1.png",
    images: [
      "/octopus%20photo/Peacock/1.png",
      "/octopus%20photo/Peacock/2.webp",
      "/octopus%20photo/Peacock/3.webp",
      "/octopus%20photo/Peacock/4.webp",
      "/octopus%20photo/Peacock/5.webp",
      "/octopus%20photo/Peacock/6.webp"
    ],
    description: "Stunning peacock feather design for elegant travelers",
    sizePrices: {
      s: { price: 589, originalPrice: 800 },
      m: { price: 649, originalPrice: 850 },
      l: { price: 689, originalPrice: 900 },
      xl: { price: 749, originalPrice: 950 }
    }
  },
  { 
    id: 25, 
    slug: "pyramids",
    name: "Pyramids", 
    category: "luggage-covers", 
    size: "l",
    gender: "unisex",
    collection: "pharaoh",
    printType: "printed",
    theme: "travel-icons", 
    color: "Orange",
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: "Best Seller", 
    image: "/octopus%20photo/Pyramids/1.png",
    images: [
      "/octopus%20photo/Pyramids/1.png",
      "/octopus%20photo/Pyramids/2.webp",
      "/octopus%20photo/Pyramids/3.webp",
      "/octopus%20photo/Pyramids/4.webp",
      "/octopus%20photo/Pyramids/5.webp",
      "/octopus%20photo/Pyramids/6.webp"
    ],
    description: "Ancient pyramids design honoring Egypt's wonders",
    sizePrices: {
      s: { price: 589, originalPrice: 800 },
      m: { price: 649, originalPrice: 850 },
      l: { price: 689, originalPrice: 900 },
      xl: { price: 749, originalPrice: 950 }
    }
  },
  { 
    id: 26, 
    slug: "tech-explorer",
    name: "Tech Explorer", 
    category: "luggage-covers", 
    size: "m",
    gender: "male",
    collection: null,
    printType: "printed",
    theme: "minimal", 
    color: "Dark Blue",
    price: 749, 
    originalPrice: 900, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Tech%20Explorer/1.png",
    images: [
      "/octopus%20photo/Tech%20Explorer/1.png",
      "/octopus%20photo/Tech%20Explorer/2.webp",
      "/octopus%20photo/Tech%20Explorer/3.webp",
      "/octopus%20photo/Tech%20Explorer/4.webp",
      "/octopus%20photo/Tech%20Explorer/5.webp",
      "/octopus%20photo/Tech%20Explorer/6.webp"
    ],
    description: "Futuristic tech design for modern adventurers",
    sizePrices: {
      s: { price: 589, originalPrice: 850 },
      m: { price: 649, originalPrice: 900 },
      l: { price: 689, originalPrice: 950 },
      xl: { price: 749, originalPrice: 1000 }
    }
  },
  { 
    id: 27, 
    slug: "wildfern",
    name: "Wildfern", 
    category: "luggage-covers", 
    size: "s",
    gender: "female",
    collection: null,
    printType: "printed",
    theme: "fun", 
    color: "Green",
    price: 599, 
    originalPrice: 750, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Wildfern/1.png",
    images: [
      "/octopus%20photo/Wildfern/1.png",
      "/octopus%20photo/Wildfern/2.webp",
      "/octopus%20photo/Wildfern/3.webp",
      "/octopus%20photo/Wildfern/4.webp",
      "/octopus%20photo/Wildfern/5.webp",
      "/octopus%20photo/Wildfern/6.webp"
    ],
    description: "Lush wild fern design for nature lovers",
    sizePrices: {
      s: { price: 589, originalPrice: 700 },
      m: { price: 649, originalPrice: 750 },
      l: { price: 689, originalPrice: 800 },
      xl: { price: 749, originalPrice: 850 }
    }
  },
  { 
    id: 28, 
    slug: "vibra",
    name: "Vibra", 
    category: "luggage-covers", 
    size: "m",
    gender: "female",
    collection: null,
    printType: "printed",
    theme: "minimal", 
    color: "Black",
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Vibra/1.png",
    images: [
      "/octopus%20photo/Vibra/1.png",
      "/octopus%20photo/Vibra/2.webp",
      "/octopus%20photo/Vibra/3.webp",
      "/octopus%20photo/Vibra/4.webp",
      "/octopus%20photo/Vibra/5.webp",
      "/octopus%20photo/Vibra/6.webp"
    ],
    description: "غطاء شنط مستوحى من الطاقة الموسيقية والنيون. تصميم عصري جريء بخطوط لامعة وتفاصيل ناعمة بيعكس روح الإيقاع والحركة. مثالي للمسافرين اللي بيحبوا الطاقة والتميز.",
    sizePrices: {
      s: { price: 589, originalPrice: 750 },
      m: { price: 649, originalPrice: 800 },
      l: { price: 689, originalPrice: 850 },
      xl: { price: 749, originalPrice: 900 }
    }
  },
  { 
    id: 29, 
    slug: "green",
    name: "Green", 
    category: "luggage-covers", 
    size: "m",
    gender: "unisex",
    collection: null,
    printType: "plain",
    theme: "minimal", 
    color: "Green",
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Green/021A9832.jpg",
    images: [
      "/octopus%20photo/Green/021A9832.jpg",
      "/octopus%20photo/Green/021A9833.jpg",
      "/octopus%20photo/Green/021A9837.jpg",
      "/octopus%20photo/Green/021A9840.jpg",
      "/octopus%20photo/Green/021A9843.jpg",
      "/octopus%20photo/Green/021A9844.jpg",
      "/octopus%20photo/Green/021A9847.jpg",
      "/octopus%20photo/Green/021A9848.jpg",
      "/octopus%20photo/Green/021A9849.jpg",
      "/octopus%20photo/Green/021A9851.jpg",
      "/octopus%20photo/Green/021A9852.jpg",
      "/octopus%20photo/Green/021A9854.jpg"
    ],
    description: "Clean minimal green luggage cover design for a fresh, modern travel look.",
    sizePrices: {
      s: { price: 589, originalPrice: 750 },
      m: { price: 649, originalPrice: 800 },
      l: { price: 689, originalPrice: 850 },
      xl: { price: 749, originalPrice: 900 }
    }
  },
  {
    id: 30,
    slug: "red",
    name: "Red",
    category: "luggage-covers",
    size: "m",
    gender: "unisex",
    collection: null,
    printType: "plain",
    theme: "minimal",
    color: "Red",
    price: 649,
    originalPrice: 800,
    type: "Luggage Cover",
    tag: null,
    image: "/octopus%20photo/Red/021A9832.jpg",
    images: [
      "/octopus%20photo/Red/021A9832.jpg",
      "/octopus%20photo/Red/021A9833.jpg",
      "/octopus%20photo/Red/021A9837.jpg",
      "/octopus%20photo/Red/021A9840.jpg",
      "/octopus%20photo/Red/021A9843.jpg",
      "/octopus%20photo/Red/021A9844.jpg",
      "/octopus%20photo/Red/021A9847.jpg",
      "/octopus%20photo/Red/021A9848.jpg",
      "/octopus%20photo/Red/021A9849.jpg",
      "/octopus%20photo/Red/021A9851.jpg",
      "/octopus%20photo/Red/021A9852.jpg",
      "/octopus%20photo/Red/021A9854.jpg"
    ],
    description: "Bold minimal red luggage cover design for a confident, modern travel look.",
    sizePrices: {
      s: { price: 589, originalPrice: 750 },
      m: { price: 649, originalPrice: 800 },
      l: { price: 689, originalPrice: 850 },
      xl: { price: 749, originalPrice: 900 }
    }
  },
  // PackOnat Packing Folder - 3 Separate Products by Color
  {
    id: 50,
    slug: "packonat-black",
    name: "PackOnat Packing Folder - Black",
    category: "packonat",
    size: null,
    theme: "minimal",
    price: 849,
    originalPrice: 999,
    type: "Packing Folder",
    tag: null,
    color: "Black",
    image: "/packOnat/Black/1.png",
    images: [
      "/packOnat/Black/1.png",
      "/packOnat/Black/2.png",
      "/packOnat/Black/3.png",
      "/packOnat/Black/4.png",
      "/packOnat/Black/5.png",
    ],
    description: "Upgrade your travel experience with the PackOnat Garment Folder by natOnat, designed to keep your clothes perfectly folded, organized, and wrinkle-free wherever you go. Whether you're traveling for business or leisure, PackOnat ensures your suits, shirts, dresses, and outfits stay flat and ready to wear straight out of your luggage."
  },
  {
    id: 51,
    slug: "packonat-green",
    name: "PackOnat Packing Folder - Green",
    category: "packonat",
    size: null,
    theme: "minimal",
    price: 849,
    originalPrice: 999,
    type: "Packing Folder",
    tag: null,
    color: "Green",
    image: "/packOnat/Green/1.png",
    images: [
      "/packOnat/Green/1.png",
      "/packOnat/Green/2.png",
      "/packOnat/Green/3.png",
      "/packOnat/Green/4.png",
      "/packOnat/Green/5.png",
    ],
    description: "Upgrade your travel experience with the PackOnat Garment Folder by natOnat, designed to keep your clothes perfectly folded, organized, and wrinkle-free wherever you go. Whether you're traveling for business or leisure, PackOnat ensures your suits, shirts, dresses, and outfits stay flat and ready to wear straight out of your luggage."
  },
  {
    id: 52,
    slug: "packonat-red",
    name: "PackOnat Packing Folder - Red",
    category: "packonat",
    size: null,
    theme: "minimal",
    price: 849,
    originalPrice: 999,
    type: "Packing Folder",
    tag: null,
    color: "Red",
    image: "/packOnat/Red/1.png",
    images: [
      "/packOnat/Red/1.png",
      "/packOnat/Red/2.png",
      "/packOnat/Red/3.png",
      "/packOnat/Red/4.png",
      "/packOnat/Red/5.png",
    ],
    description: "Upgrade your travel experience with the PackOnat Garment Folder by natOnat, designed to keep your clothes perfectly folded, organized, and wrinkle-free wherever you go. Whether you're traveling for business or leisure, PackOnat ensures your suits, shirts, dresses, and outfits stay flat and ready to wear straight out of your luggage."
  },
  
  // Bundles - Updated with new discount structure
  // 1. Three Sizes Bundle - 8% off on total (dynamic pricing)
  {
    id: 101,
    slug: "three-sizes-bundle",
    name: "Three Sizes Bundle",
    category: "bundles",
    size: null,
    theme: "mixed",
    price: 0,
    originalPrice: 0,
    type: "Bundle",
    tag: "Best Value",
    image: "/bundles/Three%20Sizes%20Bundle/6o.png",
    images: [
      "/bundles/Three%20Sizes%20Bundle/6o.png",
      "/bundles/Three%20Sizes%20Bundle/7o.png"
    ],
    description: "Complete set with S, M, and L size covers for all your luggage (8% off on total)",
    isBundle: true,
    dynamicPricing: true,
    pricingRule: "total_8_percent_off",
    bundleItems: [
      { productIds: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30], quantity: 1, label: "First Cover" },
      { productIds: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30], quantity: 1, label: "Second Cover" },
      { productIds: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30], quantity: 1, label: "Third Cover" }
    ],
    features: ["3 Different sizes (S, M, L)", "8% off on total", "Perfect for families", "Complete luggage protection"]
  },
  // 2. All Set Bundle - 18% off (Passport + Cover + PackOnat)
  {
    id: 102,
    slug: "all-set-bundle",
    name: "All Set Bundle",
    category: "bundles",
    size: null,
    theme: "mixed",
    price: 2889,
    originalPrice: 3200,
    type: "Bundle",
    tag: "Popular",
    image: "/bundles/All%20Set%20Bundel/1%20o.png",
    images: [
      "/bundles/All%20Set%20Bundel/1%20o.png",
      "/bundles/All%20Set%20Bundel/2o.png"
    ],
    description: "Everything you need - luggage cover, packing folder, and passport wallet",
    isBundle: true,
    bundleItems: [
      { productIds: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30], quantity: 1, label: "Select Luggage Cover" },
      { productIds: [50, 51, 52], quantity: 1, label: "Select PackOnat Color" },
      { productIds: [107, 108, 109], quantity: 1, label: "Select Passport Wallet Color" }
    ],
    features: ["Cover + Packing Folder + Passport", "Save 18%", "Complete travel kit", "Ready to go"]
  },
  // 3. PackOnat with Cover - 8% off on cover (dynamic pricing)
  {
    id: 103,
    slug: "packonat-cover-bundle",
    name: "PackOnat + Cover",
    category: "bundles",
    size: null,
    theme: "minimal",
    price: 0,
    originalPrice: 0,
    type: "Bundle",
    tag: null,
    image: "/bundles/PackOnat%20%2B%20Cover/3o.png",
    images: [
      "/bundles/PackOnat%20%2B%20Cover/3o.png",
      "/bundles/PackOnat%20%2B%20Cover/4o.png"
    ],
    description: "Travel in style with packing folder and matching cover (8% off on cover)",
    isBundle: true,
    dynamicPricing: true,
    pricingRule: "cover_8_percent_off",
    bundleItems: [
      { productIds: [50, 51, 52], quantity: 1, label: "Select PackOnat Color" },
      { productIds: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30], quantity: 1, label: "Select Luggage Cover" }
    ],
    features: ["Packing Folder + Cover combo", "8% off on cover", "Modern design", "Travel essentials"]
  },
  // 4. 2 Covers + PackOnat - 10% off on PackOnat (price calculated in bundle page)
  {
    id: 104,
    slug: "double-cover-packonat-bundle",
    name: "2 Covers + PackOnat",
    category: "bundles",
    size: null,
    theme: "mixed",
    price: 0,
    originalPrice: 0,
    type: "Bundle",
    tag: "Best Seller",
    image: "/bundles/2%20Covers%20%2B%20packOnat/5o.png",
    images: [
      "/bundles/2%20Covers%20%2B%20packOnat/5o.png",
      "/bundles/2%20Covers%20%2B%20packOnat/8o.png"
    ],
    description: "Perfect for couples - two covers and a shared packing folder (10% off on PackOnat)",
    isBundle: true,
    dynamicPricing: true,
    pricingRule: "packonat_10_percent_off",
    bundleItems: [
      { productIds: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30], quantity: 1, label: "First Cover" },
      { productIds: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30], quantity: 1, label: "Second Cover" },
      { productIds: [50, 51, 52], quantity: 1, label: "Select PackOnat Color" }
    ],
    features: ["2 Covers + Packing Folder", "10% off on PackOnat", "Perfect for couples", "Travel together"]
  },
  // 5. 2 PackOnat - 12% off
  {
    id: 105,
    slug: "double-packonat-bundle",
    name: "2 PackOnat Bundle",
    category: "bundles",
    size: null,
    theme: "minimal",
    price: 1669,
    originalPrice: 1850,
    type: "Bundle",
    tag: null,
    image: "/bundles/2%20PackOnat%20Bundle/10o.png",
    images: [
      "/bundles/2%20PackOnat%20Bundle/10o.png",
      "/bundles/2%20PackOnat%20Bundle/10o.png",
    ],
    description: "Double the style - two PackOnat packing folders",
    isBundle: true,
    bundleItems: [
      { productIds: [50, 51, 52], quantity: 1, label: "First PackOnat Color" },
      { productIds: [50, 51, 52], quantity: 1, label: "Second PackOnat Color" }
    ],
    features: ["2 PackOnat packing folders", "Save 12%", "His & Hers", "Matching set"]
  },
  // 6. 2 Passport Wallets - Fixed price bundle
  {
    id: 110,
    slug: "double-passport-wallets-bundle",
    name: "2 Passport Wallets",
    category: "bundles",
    size: null,
    theme: "minimal",
    price: 3149,
    originalPrice: 3578,
    type: "Bundle",
    tag: "Best Value",
    image: "/passport%20wallet/Cognac%20brown/1.png",
    images: [
      "/passport%20wallet/Cognac%20brown/1.png",
      "/passport%20wallet/Espresso%20brown/1.png"
    ],
    description: "Perfect for couples - two premium passport wallets",
    isBundle: true,
    bundleItems: [
      { productIds: [107, 108, 109], quantity: 1, label: "First Passport Wallet Color" },
      { productIds: [107, 108, 109], quantity: 1, label: "Second Passport Wallet Color" }
    ],
    features: ["2 Passport Wallets", "RFID Protection", "His & Hers", "Premium Leather"]
  },
  // 7. Passport + Cover - 15% off on cover (dynamic pricing)
  {
    id: 106,
    slug: "passport-cover-bundle",
    name: "Passport + Cover",
    category: "bundles",
    size: null,
    theme: "mixed",
    price: 0,
    originalPrice: 0,
    type: "Bundle",
    tag: "Essential",
    image: "/bundles/Passport%20_%20cover/9o.png",
    images: [
      "/bundles/Passport%20_%20cover/9o.png",
      "/bundles/Passport%20_%20cover/9o.png"
    ],
    description: "Essential travel combo - passport wallet and luggage cover (15% off on cover)",
    isBundle: true,
    dynamicPricing: true,
    pricingRule: "passport_cover_15_percent_off",
    bundleItems: [
      { productIds: [107, 108, 109], quantity: 1, label: "Select Passport Wallet Color" },
      { productIds: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30], quantity: 1, label: "Select Luggage Cover" }
    ],
    features: ["Passport + Cover combo", "15% off on cover", "Travel ready", "Perfect pair"]
  },
  // 7. 2 Covers - 5% off on 2nd cheapest (dynamic pricing)
  {
    id: 111,
    slug: "double-covers-bundle",
    name: "2 Covers",
    category: "bundles",
    size: null,
    theme: "mixed",
    price: 0,
    originalPrice: 0,
    type: "Bundle",
    tag: null,
    image: "/bundles/2 Cover/1.jpeg",
    images: [
      "/bundles/2 Cover/1.jpeg",
      "/bundles/2 Cover/2.jpeg",
      "/bundles/2 Cover/3.jpeg"
    ],
    description: "Perfect for couples - two luggage covers (5% off on 2nd cheapest)",
    isBundle: true,
    dynamicPricing: true,
    pricingRule: "second_cheapest_5_percent_off",
    bundleItems: [
      { productIds: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30], quantity: 1, label: "First Cover" },
      { productIds: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30], quantity: 1, label: "Second Cover" }
    ],
    features: ["2 Luggage Covers", "5% off on 2nd cheapest", "Perfect for couples", "Travel together"]
  },
  // 8. 4 Covers - 10% off on total (dynamic pricing)
  {
    id: 112,
    slug: "quad-covers-bundle",
    name: "4 Covers",
    category: "bundles",
    size: null,
    theme: "mixed",
    price: 0,
    originalPrice: 0,
    type: "Bundle",
    tag: "Best Value",
    image: "/bundles/4 Cover/2.jpeg",
    images: [
      "/bundles/4 Cover/1.jpeg",
      "/bundles/4 Cover/2.jpeg",
    ],
    description: "Complete family set - four luggage covers (10% off on total)",
    isBundle: true,
    dynamicPricing: true,
    pricingRule: "total_10_percent_off",
    bundleItems: [
      { productIds: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30], quantity: 1, label: "First Cover" },
      { productIds: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30], quantity: 1, label: "Second Cover" },
      { productIds: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30], quantity: 1, label: "Third Cover" },
      { productIds: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30], quantity: 1, label: "Fourth Cover" }
    ],
    features: ["4 Luggage Covers", "10% off on total", "Perfect for families", "Complete protection"]
  },
  // Eoehro Passport Holder - 3 Separate Products by Color
  {
    id: 107,
    slug: "eoehro-passport-holder-cognac",
    name: "Passport Wallet - Cognac Brown",
    category: "passport-wallets",
    size: null,
    theme: "minimal",
    price: 1789,
    originalPrice: 1950,
    type: "Passport Wallet",
    tag: "New",
    color: "Cognac Brown",
    image: "/passport%20wallet/Cognac%20brown/1.png",
    images: [
      "/passport%20wallet/Cognac%20brown/1.png",
      "/passport%20wallet/Cognac%20brown/2.png",
      "/passport%20wallet/Cognac%20brown/3.png",
      "/passport%20wallet/Cognac%20brown/4.png",
      "/passport%20wallet/Cognac%20brown/5.png"
    ],
    description: "RFID Protected faux leather passport wallet in Cognac Brown with magnetic clasp, vaccine card slot, and 5 pockets for cards, tickets, and SIM cards.",
    features: ["RFID Blocking", "Magnetic Clasp", "Vaccine Card Slot", "5 Card Pockets", "Faux Leather", "Cognac Brown Color"]
  },
  {
    id: 108,
    slug: "eoehro-passport-holder-espresso",
    name: "Passport Wallet - Espresso Brown",
    category: "passport-wallets",
    size: null,
    theme: "minimal",
    price: 1789,
    originalPrice: 1950,
    type: "Passport Wallet",
    tag: "New",
    color: "Espresso Brown",
    image: "/passport%20wallet/Espresso%20brown/1.png",
    images: [
      "/passport%20wallet/Espresso%20brown/1.png",
      "/passport%20wallet/Espresso%20brown/2.png",
      "/passport%20wallet/Espresso%20brown/3.png",
      "/passport%20wallet/Espresso%20brown/4.png",
      "/passport%20wallet/Espresso%20brown/5.png"
    ],
    description: "RFID Protected faux leather passport wallet in Espresso Brown with magnetic clasp, vaccine card slot, and 5 pockets for cards, tickets, and SIM cards.",
    features: ["RFID Blocking", "Magnetic Clasp", "Vaccine Card Slot", "5 Card Pockets", "Faux Leather", "Espresso Brown Color"]
  },
  {
    id: 109,
    slug: "eoehro-passport-holder-honey",
    name: "Passport Wallet - Honey Brown",
    category: "passport-wallets",
    size: null,
    theme: "minimal",
    price: 1789,
    originalPrice: 1950,
    type: "Passport Wallet",
    tag: "New",
    color: "Honey Brown",
    image: "/passport%20wallet/Honey%20brown/1.png",
    images: [
      "/passport%20wallet/Honey%20brown/1.png",
      "/passport%20wallet/Honey%20brown/2.png",
      "/passport%20wallet/Honey%20brown/3.png",
      "/passport%20wallet/Honey%20brown/4.png",
      "/passport%20wallet/Honey%20brown/5.png"
    ],
    description: "RFID Protected faux leather passport wallet in Honey Brown with magnetic clasp, vaccine card slot, and 5 pockets for cards, tickets, and SIM cards.",
    features: ["RFID Blocking", "Magnetic Clasp", "Vaccine Card Slot", "5 Card Pockets", "Faux Leather", "Honey Brown Color"]
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

// Extract discount percentage from pricing rule
export const getDiscountPercentage = (product: Product): number | null => {
  if (!product.pricingRule) return null;
  
  const rule = product.pricingRule.toLowerCase();
  
  if (rule.includes('total_8_percent_off') || rule.includes('cover_8_percent_off')) return 8;
  if (rule.includes('packonat_10_percent_off')) return 10;
  if (rule.includes('passport_cover_15_percent_off')) return 15;
  if (rule.includes('second_cheapest_5_percent_off')) return 5;
  if (rule.includes('total_10_percent_off')) return 10;
  
  return null;
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

export const getPackOnat = (): Product[] => {
  return products.filter(p => p.category === "packonat");
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
  { id: "packonat", label: "PackOnat" },
];

// New filter options for luggage covers
export const genders = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "unisex", label: "Unisex" },
];

export const collections = [
  { id: "sports", label: "Sports" },
  { id: "pharaoh", label: "Pharaoh Collection" },
];

export const printTypes = [
  { id: "plain", label: "Plain Models" },
  { id: "printed", label: "Printed Models" },
];

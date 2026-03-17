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
    tag: null, 
    image: "/octopus%20photo/ACCORD/1.webp",
    images: [
      "/octopus%20photo/ACCORD/1.webp",
      "/octopus%20photo/ACCORD/2.webp",
      "/octopus%20photo/ACCORD/3.webp",
      "/octopus%20photo/ACCORD/4.webp",
      "/octopus%20photo/ACCORD/5.webp",
      "/octopus%20photo/ACCORD/6.webp"
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
    image: "/octopus%20photo/Anara/1.webp",
    images: [
      "/octopus%20photo/Anara/1.webp",
      "/octopus%20photo/Anara/2.webp",
      "/octopus%20photo/Anara/3.webp",
      "/octopus%20photo/Anara/4.webp",
      "/octopus%20photo/Anara/5.webp",
      "/octopus%20photo/Anara/6.webp"
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
    tag: "Best Seller", 
    image: "/octopus%20photo/Ascend/1.webp",
    images: [
      "/octopus%20photo/Ascend/1.webp",
      "/octopus%20photo/Ascend/2.webp",
      "/octopus%20photo/Ascend/3.webp",
      "/octopus%20photo/Ascend/4.webp",
      "/octopus%20photo/Ascend/5.webp",
      "/octopus%20photo/Ascend/6.webp"
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
    image: "/octopus%20photo/Dubai/1.webp",
    images: [
      "/octopus%20photo/Dubai/1.webp",
      "/octopus%20photo/Dubai/2.webp",
      "/octopus%20photo/Dubai/3.webp",
      "/octopus%20photo/Dubai/4.webp",
      "/octopus%20photo/Dubai/5.webp",
      "/octopus%20photo/Dubai/6.webp"
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
    image: "/octopus%20photo/Egypt%20Skyline/1.webp",
    images: [
      "/octopus%20photo/Egypt%20Skyline/1.webp",
      "/octopus%20photo/Egypt%20Skyline/2.webp",
      "/octopus%20photo/Egypt%20Skyline/3.webp",
      "/octopus%20photo/Egypt%20Skyline/4.webp",
      "/octopus%20photo/Egypt%20Skyline/5.webp",
      "/octopus%20photo/Egypt%20Skyline/6.webp"
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
    image: "/octopus%20photo/Egyptian%20Queen/1.webp",
    images: [
      "/octopus%20photo/Egyptian%20Queen/1.webp",
      "/octopus%20photo/Egyptian%20Queen/2.webp",
      "/octopus%20photo/Egyptian%20Queen/3.webp",
      "/octopus%20photo/Egyptian%20Queen/4.webp",
      "/octopus%20photo/Egyptian%20Queen/5.webp",
      "/octopus%20photo/Egyptian%20Queen/6.webp"
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
    image: "/octopus%20photo/Eternal%20Egypt/1.webp",
    images: [
      "/octopus%20photo/Eternal%20Egypt/1.webp",
      "/octopus%20photo/Eternal%20Egypt/2.webp",
      "/octopus%20photo/Eternal%20Egypt/3.webp",
      "/octopus%20photo/Eternal%20Egypt/4.webp",
      "/octopus%20photo/Eternal%20Egypt/5.webp",
      "/octopus%20photo/Eternal%20Egypt/6.webp"
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
    image: "/octopus%20photo/Festival/1.webp",
    images: [
      "/octopus%20photo/Festival/1.webp",
      "/octopus%20photo/Festival/2.webp",
      "/octopus%20photo/Festival/3.webp",
      "/octopus%20photo/Festival/4.webp",
      "/octopus%20photo/Festival/5.webp",
      "/octopus%20photo/Festival/6.webp"
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
    image: "/octopus%20photo/Lotus/1.webp",
    images: [
      "/octopus%20photo/Lotus/1.webp",
      "/octopus%20photo/Lotus/2.webp",
      "/octopus%20photo/Lotus/3.webp",
      "/octopus%20photo/Lotus/4.webp",
      "/octopus%20photo/Lotus/5.webp",
      "/octopus%20photo/Lotus/6.webp"
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
    image: "/octopus%20photo/Lunara/1.webp",
    images: [
      "/octopus%20photo/Lunara/1.webp",
      "/octopus%20photo/Lunara/2.webp",
      "/octopus%20photo/Lunara/3.webp",
      "/octopus%20photo/Lunara/4.webp",
      "/octopus%20photo/Lunara/5.webp",
      "/octopus%20photo/Lunara/6.webp"
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
    image: "/octopus%20photo/New%20York/1.webp",
    images: [
      "/octopus%20photo/New%20York/1.webp",
      "/octopus%20photo/New%20York/2.webp",
      "/octopus%20photo/New%20York/3.webp",
      "/octopus%20photo/New%20York/4.webp",
      "/octopus%20photo/New%20York/5.webp",
      "/octopus%20photo/New%20York/6.webp"
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
    image: "/octopus%20photo/Optical%20Illusion/1.webp",
    images: [
      "/octopus%20photo/Optical%20Illusion/1.webp",
      "/octopus%20photo/Optical%20Illusion/2.webp",
      "/octopus%20photo/Optical%20Illusion/3.webp",
      "/octopus%20photo/Optical%20Illusion/4.webp",
      "/octopus%20photo/Optical%20Illusion/5.webp",
      "/octopus%20photo/Optical%20Illusion/6.webp"
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
    image: "/octopus%20photo/Solora/1.webp",
    images: [
      "/octopus%20photo/Solora/1.webp",
      "/octopus%20photo/Solora/2.webp",
      "/octopus%20photo/Solora/3.webp",
      "/octopus%20photo/Solora/4.webp",
      "/octopus%20photo/Solora/5.webp",
      "/octopus%20photo/Solora/6.webp"
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
    image: "/octopus%20photo/Travel%20Mosaic/1.webp",
    images: [
      "/octopus%20photo/Travel%20Mosaic/1.webp",
      "/octopus%20photo/Travel%20Mosaic/2.webp",
      "/octopus%20photo/Travel%20Mosaic/3.webp",
      "/octopus%20photo/Travel%20Mosaic/4.webp",
      "/octopus%20photo/Travel%20Mosaic/5.webp",
      "/octopus%20photo/Travel%20Mosaic/6.webp"
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
    image: "/octopus%20photo/king%20Tut/1.webp",
    images: [
      "/octopus%20photo/king%20Tut/1.webp",
      "/octopus%20photo/king%20Tut/2.webp",
      "/octopus%20photo/king%20Tut/3.webp",
      "/octopus%20photo/king%20Tut/4.webp",
      "/octopus%20photo/king%20Tut/5.webp",
      "/octopus%20photo/king%20Tut/6.webp"
    ],
    description: "Ancient Egyptian pharaoh inspired design"
  },
  { 
    id: 16, 
    slug: "black",
    name: "Black", 
    category: "luggage-covers", 
    size: "m", 
    theme: "minimal", 
    price: 599, 
    originalPrice: 750, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Black/1.webp",
    images: [
      "/octopus%20photo/Black/1.webp",
      "/octopus%20photo/Black/2.webp",
      "/octopus%20photo/Black/3.webp",
      "/octopus%20photo/Black/4.webp",
      "/octopus%20photo/Black/5.webp",
      "/octopus%20photo/Black/6.webp"
    ],
    description: "Classic black design for sophisticated travelers"
  },
  { 
    id: 17, 
    slug: "explore",
    name: "Explore", 
    category: "luggage-covers", 
    size: "l", 
    theme: "travel-icons", 
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: "New", 
    image: "/octopus%20photo/Explore/1.webp",
    images: [
      "/octopus%20photo/Explore/1.webp",
      "/octopus%20photo/Explore/2.webp",
      "/octopus%20photo/Explore/3.webp",
      "/octopus%20photo/Explore/4.webp",
      "/octopus%20photo/Explore/5.webp",
      "/octopus%20photo/Explore/6.webp"
    ],
    description: "Adventure awaits with this exploration-inspired design"
  },
  { 
    id: 18, 
    slug: "outdoor",
    name: "Outdoor", 
    category: "luggage-covers", 
    size: "s", 
    theme: "minimal", 
    price: 549, 
    originalPrice: 700, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Outdoor/1.webp",
    images: [
      "/octopus%20photo/Outdoor/1.webp",
      "/octopus%20photo/Outdoor/2.webp",
      "/octopus%20photo/Outdoor/3.webp",
      "/octopus%20photo/Outdoor/4.webp",
      "/octopus%20photo/Outdoor/5.webp",
      "/octopus%20photo/Outdoor/6.webp"
    ],
    description: "Nature-inspired design for outdoor enthusiasts"
  },
  { 
    id: 19, 
    slug: "travel-stickers",
    name: "Travel Stickers", 
    category: "luggage-covers", 
    size: "m", 
    theme: "travel-icons", 
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Travel%20Stickers/1.webp",
    images: [
      "/octopus%20photo/Travel%20Stickers/1.webp",
      "/octopus%20photo/Travel%20Stickers/2.webp",
      "/octopus%20photo/Travel%20Stickers/3.webp",
      "/octopus%20photo/Travel%20Stickers/4.webp",
      "/octopus%20photo/Travel%20Stickers/5.webp",
      "/octopus%20photo/Travel%20Stickers/6.webp"
    ],
    description: "Colorful travel stickers design for wanderlust souls"
  },
  { 
    id: 20, 
    slug: "urban-vibes",
    name: "Urban Vibes", 
    category: "luggage-covers", 
    size: "l", 
    theme: "minimal", 
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: "Best Seller", 
    image: "/octopus%20photo/Urban%20Vibes/1.webp",
    images: [
      "/octopus%20photo/Urban%20Vibes/1.webp",
      "/octopus%20photo/Urban%20Vibes/2.webp",
      "/octopus%20photo/Urban%20Vibes/3.webp",
      "/octopus%20photo/Urban%20Vibes/4.webp",
      "/octopus%20photo/Urban%20Vibes/5.webp",
      "/octopus%20photo/Urban%20Vibes/6.webp"
    ],
    description: "Modern urban aesthetic for city travelers"
  },
  { 
    id: 21, 
    slug: "valoria",
    name: "Valoria", 
    category: "luggage-covers", 
    size: "m", 
    theme: "fun", 
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Valoria/1.webp",
    images: [
      "/octopus%20photo/Valoria/1.webp",
      "/octopus%20photo/Valoria/2.webp",
      "/octopus%20photo/Valoria/3.webp",
      "/octopus%20photo/Valoria/4.webp",
      "/octopus%20photo/Valoria/5.webp",
      "/octopus%20photo/Valoria/6.webp"
    ],
    description: "Bold and vibrant design for confident travelers"
  },
  { 
    id: 22, 
    slug: "barcelona",
    name: "Barcelona", 
    category: "luggage-covers", 
    size: "m", 
    theme: "travel-icons", 
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: "New", 
    image: "/octopus%20photo/Barcelona/1.webp",
    images: [
      "/octopus%20photo/Barcelona/1.webp",
      "/octopus%20photo/Barcelona/2.webp",
      "/octopus%20photo/Barcelona/3.webp",
      "/octopus%20photo/Barcelona/4.webp",
      "/octopus%20photo/Barcelona/5.webp",
      "/octopus%20photo/Barcelona/6.webp"
    ],
    description: "Vibrant Barcelona-inspired design for passionate travelers"
  },
  { 
    id: 23, 
    slug: "madrid",
    name: "Madrid", 
    category: "luggage-covers", 
    size: "l", 
    theme: "travel-icons", 
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Madrid/1.webp",
    images: [
      "/octopus%20photo/Madrid/1.webp",
      "/octopus%20photo/Madrid/2.webp",
      "/octopus%20photo/Madrid/3.webp",
      "/octopus%20photo/Madrid/4.webp",
      "/octopus%20photo/Madrid/5.webp",
      "/octopus%20photo/Madrid/6.webp"
    ],
    description: "Elegant Madrid design celebrating Spanish culture"
  },
  { 
    id: 24, 
    slug: "peacock",
    name: "Peacock", 
    category: "luggage-covers", 
    size: "m", 
    theme: "fun", 
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: "New", 
    image: "/octopus%20photo/Peacock/1.webp",
    images: [
      "/octopus%20photo/Peacock/1.webp",
      "/octopus%20photo/Peacock/2.webp",
      "/octopus%20photo/Peacock/3.webp",
      "/octopus%20photo/Peacock/4.webp",
      "/octopus%20photo/Peacock/5.webp",
      "/octopus%20photo/Peacock/6.webp"
    ],
    description: "Stunning peacock feather design for elegant travelers"
  },
  { 
    id: 25, 
    slug: "pyramids",
    name: "Pyramids", 
    category: "luggage-covers", 
    size: "l", 
    theme: "travel-icons", 
    price: 699, 
    originalPrice: 850, 
    type: "Luggage Cover", 
    tag: "Best Seller", 
    image: "/octopus%20photo/Pyramids/1.webp",
    images: [
      "/octopus%20photo/Pyramids/1.webp",
      "/octopus%20photo/Pyramids/2.webp",
      "/octopus%20photo/Pyramids/3.webp",
      "/octopus%20photo/Pyramids/4.webp",
      "/octopus%20photo/Pyramids/5.webp",
      "/octopus%20photo/Pyramids/6.webp"
    ],
    description: "Ancient pyramids design honoring Egypt's wonders"
  },
  { 
    id: 26, 
    slug: "tech-explorer",
    name: "Tech Explorer", 
    category: "luggage-covers", 
    size: "m", 
    theme: "minimal", 
    price: 749, 
    originalPrice: 900, 
    type: "Luggage Cover", 
    tag: "New", 
    image: "/octopus%20photo/Tech%20Explorer/1.webp",
    images: [
      "/octopus%20photo/Tech%20Explorer/1.webp",
      "/octopus%20photo/Tech%20Explorer/2.webp",
      "/octopus%20photo/Tech%20Explorer/3.webp",
      "/octopus%20photo/Tech%20Explorer/4.webp",
      "/octopus%20photo/Tech%20Explorer/5.webp",
      "/octopus%20photo/Tech%20Explorer/6.webp"
    ],
    description: "Futuristic tech design for modern adventurers"
  },
  { 
    id: 27, 
    slug: "wildfern",
    name: "Wildfern", 
    category: "luggage-covers", 
    size: "s", 
    theme: "fun", 
    price: 599, 
    originalPrice: 750, 
    type: "Luggage Cover", 
    tag: null, 
    image: "/octopus%20photo/Wildfern/1.webp",
    images: [
      "/octopus%20photo/Wildfern/1.webp",
      "/octopus%20photo/Wildfern/2.webp",
      "/octopus%20photo/Wildfern/3.webp",
      "/octopus%20photo/Wildfern/4.webp",
      "/octopus%20photo/Wildfern/5.webp",
      "/octopus%20photo/Wildfern/6.webp"
    ],
    description: "Lush wild fern design for nature lovers"
  },
  { 
    id: 28, 
    slug: "vibra",
    name: "Vibra", 
    category: "luggage-covers", 
    size: "m", 
    theme: "minimal", 
    price: 649, 
    originalPrice: 800, 
    type: "Luggage Cover", 
    tag: "New", 
    image: "/octopus%20photo/Vibra/1.webp",
    images: [
      "/octopus%20photo/Vibra/1.webp",
      "/octopus%20photo/Vibra/2.webp",
      "/octopus%20photo/Vibra/3.webp",
      "/octopus%20photo/Vibra/4.webp",
      "/octopus%20photo/Vibra/5.webp",
      "/octopus%20photo/Vibra/6.webp"
    ],
    description: "Vibrant energy design for dynamic travelers"
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
    tag: null,
    image: "/octopus%20photo/Egyptian%20Queen/1.webp",
    images: [
      "/octopus%20photo/Egyptian%20Queen/1.webp",
      "/octopus%20photo/Egypt%20Skyline/1.webp",
      "/octopus%20photo/king%20Tut/1.webp"
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
    image: "/octopus%20photo/ACCORD/1.webp",
    images: [
      "/octopus%20photo/ACCORD/1.webp",
      "/octopus%20photo/Solora/1.webp"
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
    image: "/octopus%20photo/Dubai/1.webp",
    images: [
      "/octopus%20photo/Dubai/1.webp",
      "/octopus%20photo/New%20York/1.webp",
      "/octopus%20photo/Travel%20Mosaic/1.webp"
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
    image: "/octopus%20photo/Festival/1.webp",
    images: [
      "/octopus%20photo/Festival/1.webp",
      "/octopus%20photo/Lunara/1.webp",
      "/octopus%20photo/Optical%20Illusion/1.webp"
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

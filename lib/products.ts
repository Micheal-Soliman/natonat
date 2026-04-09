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
    theme: "fun", 
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
    theme: "minimal", 
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
    theme: "travel-icons", 
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
    theme: "travel-icons", 
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
    theme: "fun", 
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
    theme: "travel-icons", 
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
    theme: "fun", 
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
    theme: "minimal", 
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
    theme: "fun", 
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
    theme: "travel-icons", 
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
    theme: "fun", 
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
    theme: "minimal", 
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
    theme: "travel-icons", 
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
    theme: "travel-icons", 
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
    theme: "minimal", 
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
    theme: "travel-icons", 
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
    theme: "minimal", 
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
    theme: "travel-icons", 
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
    theme: "minimal", 
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
    theme: "fun", 
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
    theme: "travel-icons", 
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
    theme: "travel-icons", 
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
    theme: "fun", 
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
    theme: "travel-icons", 
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
    theme: "minimal", 
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
    theme: "fun", 
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
    theme: "minimal", 
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
  // BackOnat Backpack (Product ID 50) - Placeholder image until real photos arrive
  { 
    id: 50, 
    slug: "backonat",
    name: "BackOnat", 
    category: "backpacks", 
    size: null, 
    theme: "minimal", 
    price: 799, 
    originalPrice: 999, 
    type: "Backpack", 
    tag: null, 
    image: "/octopus%20photo/ACCORD/1.png",
    images: [
      "/octopus%20photo/ACCORD/1.png"
    ],
    description: "Stylish travel backpack perfect for your journey"
  },
  
  // Bundles - Updated with new discount structure
  // 1. Three Sizes Bundle - 15% off
  {
    id: 101,
    slug: "three-sizes-bundle",
    name: "Three Sizes Bundle",
    category: "bundles",
    size: null,
    theme: "mixed",
    price: 1650,
    originalPrice: 1947,
    type: "Bundle",
    tag: "Best Value",
    image: "/octopus%20photo/Wildfern/1.png",
    images: [
      "/octopus%20photo/Wildfern/1.png",
      "/octopus%20photo/Anara/1.png",
      "/octopus%20photo/Ascend/1.png"
    ],
    description: "Complete set with S, M, and L size covers for all your luggage",
    isBundle: true,
    bundleItems: [
      { productId: 27, quantity: 1 }, // Wildfern S
      { productId: 2, quantity: 1 },  // Anara M
      { productId: 3, quantity: 1 }   // Ascend L
    ],
    features: ["3 Different sizes (S, M, L)", "Save 15%", "Perfect for families", "Complete luggage protection"]
  },
  // 2. All Set Bundle - 18% off (Passport + Cover + BackOnat)
  {
    id: 102,
    slug: "all-set-bundle",
    name: "All Set Bundle",
    category: "bundles",
    size: null,
    theme: "mixed",
    price: 1649,
    originalPrice: 2012,
    type: "Bundle",
    tag: "Popular",
    image: "/octopus%20photo/ACCORD/1.png",
    images: [
      "/octopus%20photo/ACCORD/1.png",
      "/octopus%20photo/Anara/1.png"
    ],
    description: "Everything you need - luggage cover, backpack, and passport wallet",
    isBundle: true,
    bundleItems: [
      { productId: 1, quantity: 1 },   // ACCORD Cover
      { productId: 50, quantity: 1 }, // BackOnat
      { productId: 29, quantity: 1 }  // Bon Voyage Passport
    ],
    features: ["Cover + Backpack + Passport", "Save 18%", "Complete travel kit", "Ready to go"]
  },
  // 3. BackOnat with Cover - 12% off
  {
    id: 103,
    slug: "backonat-cover-bundle",
    name: "BackOnat + Cover",
    category: "bundles",
    size: null,
    theme: "minimal",
    price: 1275,
    originalPrice: 1448,
    type: "Bundle",
    tag: null,
    image: "/octopus%20photo/ACCORD/1.png",
    images: [
      "/octopus%20photo/ACCORD/1.png",
      "/octopus%20photo/ACCORD/2.webp"
    ],
    description: "Travel in style with backpack and matching cover",
    isBundle: true,
    bundleItems: [
      { productId: 50, quantity: 1 }, // BackOnat
      { productId: 1, quantity: 1 }   // ACCORD Cover
    ],
    features: ["Backpack + Cover combo", "Save 12%", "Modern design", "Travel essentials"]
  },
  // 4. 2 Covers + BackOnat - 15% off
  {
    id: 104,
    slug: "double-cover-backonat-bundle",
    name: "2 Covers + BackOnat",
    category: "bundles",
    size: null,
    theme: "mixed",
    price: 1799,
    originalPrice: 2117,
    type: "Bundle",
    tag: "Best Seller",
    image: "/octopus%20photo/Anara/1.png",
    images: [
      "/octopus%20photo/Anara/1.png",
      "/octopus%20photo/Solora/1.png"
    ],
    description: "Perfect for couples - two covers and a shared backpack",
    isBundle: true,
    bundleItems: [
      { productId: 2, quantity: 1 },   // Anara Cover
      { productId: 13, quantity: 1 }, // Solora Cover
      { productId: 50, quantity: 1 }  // BackOnat
    ],
    features: ["2 Covers + Backpack", "Save 15%", "Perfect for couples", "Travel together"]
  },
  // 5. 2 BackOnat - 12% off
  {
    id: 105,
    slug: "double-backonat-bundle",
    name: "2 BackOnat Bundle",
    category: "bundles",
    size: null,
    theme: "minimal",
    price: 1399,
    originalPrice: 1598,
    type: "Bundle",
    tag: null,
    image: "/octopus%20photo/ACCORD/1.png",
    images: [
      "/octopus%20photo/ACCORD/1.png"
    ],
    description: "Double the style - two BackOnat backpacks",
    isBundle: true,
    bundleItems: [
      { productId: 50, quantity: 2 }  // 2x BackOnat
    ],
    features: ["2 BackOnat backpacks", "Save 12%", "His & Hers", "Matching set"]
  },
  // 6. Passport + Any Item - 15% off (Passport + Cover combo)
  {
    id: 106,
    slug: "passport-cover-bundle",
    name: "Passport + Cover",
    category: "bundles",
    size: null,
    theme: "mixed",
    price: 999,
    originalPrice: 1173,
    type: "Bundle",
    tag: "Essential",
    image: "/octopus%20photo/Anara/1.png",
    images: [
      "/octopus%20photo/Anara/1.png",
      "/octopus%20photo/ACCORD/1.png"
    ],
    description: "Essential travel combo - passport wallet and luggage cover",
    isBundle: true,
    bundleItems: [
      { productId: 29, quantity: 1 }, // Bon Voyage Passport
      { productId: 1, quantity: 1 }   // ACCORD Cover
    ],
    features: ["Passport + Cover combo", "Save 15%", "Travel ready", "Perfect pair"]
  },
  // Eoehro Passport Holder - 1 Product with 3 Colors
  {
    id: 107,
    slug: "eoehro-passport-holder",
    name: "Eoehro Passport Holder",
    category: "passport-wallets",
    size: null,
    theme: "minimal",
    price: 1789,
    originalPrice: 1950,
    type: "Passport Wallet",
    tag: "New",
    image: "/passport%20wallet/1/1.png",
    images: [
      "/passport%20wallet/1/1.png",
      "/passport%20wallet/1/2.png",
      "/passport%20wallet/1/3.png",
      "/passport%20wallet/2/1.png",
      "/passport%20wallet/2/2.png",
      "/passport%20wallet/2/3.png",
      "/passport%20wallet/3/1.png",
      "/passport%20wallet/3/2.png",
      "/passport%20wallet/3/3.png"
    ],
    description: "RFID Protected faux leather passport holder with magnetic clasp, vaccine card slot, and 5 pockets for cards, tickets, and SIM cards. Available in 3 colors: Brown, Black, and Tan.",
    features: ["RFID Blocking", "Magnetic Clasp", "Vaccine Card Slot", "5 Card Pockets", "Faux Leather", "3 Colors Available"],
    colors: [
      { id: "brown", name: "Brown", image: "/passport%20wallet/1/1.png" },
      { id: "tan", name: "Tan", image: "/passport%20wallet/2/1.png" },
      { id: "black", name: "Black", image: "/passport%20wallet/3/1.png" }
    ]
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

export const getBackpacks = (): Product[] => {
  return products.filter(p => p.category === "backpacks");
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
  { id: "backpacks", label: "Backpacks" },
];

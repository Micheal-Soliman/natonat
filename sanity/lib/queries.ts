import { groq } from "next-sanity";

export const activeProductsQuery = groq`
  *[_type == "product" && isActive != false] | order(sortOrder asc, legacyId asc) {
    _id,
    legacyId,
    name,
    "slug": slug.current,
    category,
    type,
    tag,
    price,
    originalPrice,
    description,
    features,
    size,
    sizePrices,
    theme,
    color,
    colors,
    imageUrl,
    "mainImageUrl": mainImage.asset->url,
    galleryUrls,
    "galleryImageUrls": galleryImages[].asset->url,
    gender,
    collection,
    printType,
    isBundle,
    bundleItems,
    dynamicPricing,
    pricingRule,
    sortOrder
  }
`;

export const productBySlugQuery = groq`
  *[_type == "product" && slug.current == $slug][0] {
    _id,
    legacyId,
    name,
    "slug": slug.current,
    category,
    type,
    tag,
    price,
    originalPrice,
    description,
    features,
    size,
    sizePrices,
    theme,
    color,
    colors,
    imageUrl,
    "mainImageUrl": mainImage.asset->url,
    galleryUrls,
    "galleryImageUrls": galleryImages[].asset->url,
    gender,
    collection,
    printType,
    isBundle,
    bundleItems,
    dynamicPricing,
    pricingRule,
    sortOrder
  }
`;

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
    colors[]{
      id,
      name,
      imageUrl,
      "imageAssetUrl": image.asset->url
    },
    imageUrl,
    "mainImageUrl": mainImage.asset->url,
    galleryUrls,
    "galleryImageUrls": galleryImages[].asset->url,
    gender,
    collection,
    printType,
    isBundle,
    bundleItems[]{
      legacyProductIds,
      quantity,
      label,
      "referencedLegacyId": product->legacyId
    },
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
    colors[]{
      id,
      name,
      imageUrl,
      "imageAssetUrl": image.asset->url
    },
    imageUrl,
    "mainImageUrl": mainImage.asset->url,
    galleryUrls,
    "galleryImageUrls": galleryImages[].asset->url,
    gender,
    collection,
    printType,
    isBundle,
    bundleItems[]{
      legacyProductIds,
      quantity,
      label,
      "referencedLegacyId": product->legacyId
    },
    dynamicPricing,
    pricingRule,
    sortOrder
  }
`;

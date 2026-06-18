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
    stockStatus,
    stockQuantity,
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
    stockStatus,
    stockQuantity,
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

export const siteSettingsQuery = groq`
  {
    "legacy": *[_type == "siteSettings"][0] {
      flashSale {
        _updatedAt,
        enabled,
        eyebrow,
        title,
        description,
        badge,
        discountLabel,
        endsAt,
        ctaLabel,
        secondaryLabel,
        "imageUrl": image.asset->url,
        product->{
          legacyId,
          name,
          "slug": slug.current,
          price,
          originalPrice,
          type,
          "imageUrl": coalesce(mainImage.asset->url, imageUrl)
        }
      },
      sizeGuide {
        label,
        title,
        subtitle,
        videoTitle,
        videoSubtitle,
        videoDuration,
        videoUrl,
        "videoFileUrl": videoFile.asset->url,
        "posterUrl": poster.asset->url,
        tips,
        sizes[] {
          size,
          cm,
          inch,
          type,
          note
        },
        note
      }
    },
    "flashSale": *[_type == "flashSaleSettings"][0] {
      _updatedAt,
      enabled,
      eyebrow,
      title,
      description,
      badge,
      discountLabel,
      endsAt,
      ctaLabel,
      secondaryLabel,
      "imageUrl": image.asset->url,
      product->{
        legacyId,
        name,
        "slug": slug.current,
        price,
        originalPrice,
        type,
        "imageUrl": coalesce(mainImage.asset->url, imageUrl)
      }
    },
    "sizeGuide": *[_type == "sizeGuideSettings"][0] {
      label,
      title,
      subtitle,
      videoTitle,
      videoSubtitle,
      videoDuration,
      videoUrl,
      "videoFileUrl": videoFile.asset->url,
      "posterUrl": poster.asset->url,
      tips,
      sizes[] {
        size,
        cm,
        inch,
        type,
        note
      },
      note
    }
  }
`;

import { groq } from "next-sanity";

export const activeProductsQuery = groq`
  *[_type == "product" && isActive != false] | order(select(sortOrder > 0 => sortOrder, 9999) asc, legacyId asc) {
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
    sizeStock,
    description,
    features,
    "relatedProductIds": relatedProducts[]->legacyId,
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
  *[_type == "product" && isActive != false && slug.current == $slug][0] {
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
    sizeStock,
    description,
    features,
    "relatedProductIds": relatedProducts[]->legacyId,
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
        sectionEnabled,
        selectedSize,
        selectedColor,
        addToCartLabel,
        buyNowLabel,
        "imageUrl": image.asset->url,
        product->{
          legacyId,
          name,
          "slug": slug.current,
          price,
          originalPrice,
          type,
          size,
          sizePrices,
          stockStatus,
          stockQuantity,
          sizeStock,
          color,
          colors[]{
            id,
            name,
            "imageUrl": coalesce(image.asset->url, imageUrl)
          },
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
      sectionEnabled,
      selectedSize,
      selectedColor,
      addToCartLabel,
      buyNowLabel,
      "imageUrl": image.asset->url,
      product->{
        legacyId,
        name,
        "slug": slug.current,
        price,
        originalPrice,
        type,
        size,
        sizePrices,
        stockStatus,
        stockQuantity,
        sizeStock,
        color,
        colors[]{
          id,
          name,
          "imageUrl": coalesce(image.asset->url, imageUrl)
        },
        "imageUrl": coalesce(mainImage.asset->url, imageUrl)
      }
    },
    "legacyFlashSaleSection": *[_type == "flashSaleSettings"][0] {
      _updatedAt,
      sectionEnabled,
      selectedSize,
      selectedColor,
      addToCartLabel,
      buyNowLabel,
      eyebrow,
      title,
      description,
      badge,
      discountLabel,
      endsAt,
      "imageUrl": image.asset->url,
      product->{
        legacyId,
        name,
        "slug": slug.current,
        price,
        originalPrice,
        type,
        size,
        sizePrices,
        stockStatus,
        stockQuantity,
        sizeStock,
        color,
        colors[]{
          id,
          name,
          "imageUrl": coalesce(image.asset->url, imageUrl)
        },
        "imageUrl": coalesce(mainImage.asset->url, imageUrl)
      }
    },
    "flashSaleSection": *[_type == "flashSaleSectionSettings"][0] {
      _updatedAt,
      "sectionEnabled": enabled,
      selectedSize,
      selectedColor,
      addToCartLabel,
      buyNowLabel,
      eyebrow,
      title,
      description,
      badge,
      discountLabel,
      endsAt,
      "imageUrl": image.asset->url,
      offers[]{
        _key,
        selectedSize,
        selectedColor,
        "imageUrl": image.asset->url,
        product->{
          legacyId,
          name,
          "slug": slug.current,
          price,
          originalPrice,
          type,
          size,
          sizePrices,
          stockStatus,
          stockQuantity,
          sizeStock,
          color,
          colors[]{
            id,
            name,
            "imageUrl": coalesce(image.asset->url, imageUrl)
          },
          "imageUrl": coalesce(mainImage.asset->url, imageUrl)
        }
      },
      product->{
        legacyId,
        name,
        "slug": slug.current,
        price,
        originalPrice,
        type,
        size,
        sizePrices,
        stockStatus,
        stockQuantity,
        sizeStock,
        color,
        colors[]{
          id,
          name,
          "imageUrl": coalesce(image.asset->url, imageUrl)
        },
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

export const discountCodeByCodeQuery = groq`
  *[_type == "discountCode" && defined(code)] {
    _id,
    title,
    code,
    isActive,
    discountType,
    value,
    maxDiscountEgp,
    minimumSubtotalEgp,
    startsAt,
    endsAt,
    allowedPaymentMethods,
    combineWithPaymentDiscount,
    appliesTo,
    "productLegacyIds": products[]->legacyId,
    "productSlugs": products[]->slug.current,
    categories,
    customerMessage
  }
`;

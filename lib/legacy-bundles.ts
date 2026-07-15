export const LEGACY_PRODUCT_BUNDLE_SLUGS = new Set([
  "three-sizes-bundle",
  "all-set-bundle",
  "packonat-cover-bundle",
  "double-cover-packonat-bundle",
  "double-packonat-bundle",
  "double-passport-wallets-bundle",
  "passport-cover-bundle",
  "double-covers-bundle",
  "quad-covers-bundle",
]);

export function isLegacyProductBundleSlug(slug?: string | null) {
  return Boolean(slug && LEGACY_PRODUCT_BUNDLE_SLUGS.has(slug));
}

export function isLegacyBundleCartItem(item: {
  slug?: string | null;
  isBundle?: boolean | null;
  bundleSelections?: unknown[] | null;
}) {
  return Boolean(
    item.isBundle ||
      item.bundleSelections?.length ||
      isLegacyProductBundleSlug(item.slug),
  );
}

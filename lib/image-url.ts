export function normalizeImageUrl(url?: string) {
  const trimmed = url?.trim();
  if (!trimmed) return "";

  const driveMatch =
    trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/) ||
    trimmed.match(/[?&]id=([^&]+)/);
  if (driveMatch?.[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }

  if (trimmed.includes("cdn.sanity.io/images/")) {
    try {
      const sanityUrl = new URL(trimmed);
      if (!sanityUrl.searchParams.has("w")) sanityUrl.searchParams.set("w", "1600");
      if (!sanityUrl.searchParams.has("auto")) sanityUrl.searchParams.set("auto", "format");
      return sanityUrl.toString();
    } catch {
      const separator = trimmed.includes("?") ? "&" : "?";
      return `${trimmed}${separator}w=1600&auto=format`;
    }
  }

  return trimmed;
}

export function normalizeImageList(urls?: string[]) {
  return (urls || []).map(normalizeImageUrl).filter(Boolean);
}

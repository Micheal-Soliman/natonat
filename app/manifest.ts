import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "natOnat",
    short_name: "natOnat",
    description: siteConfig.description,
    start_url: "/en",
    display: "standalone",
    background_color: "#F1EBE3",
    theme_color: "#EEBC3F",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
      {
        src: "/logo-after.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

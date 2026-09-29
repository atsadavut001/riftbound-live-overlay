import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://riftbound-live-overlay.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private/admin/transient surfaces out of search results
        disallow: ["/admin", "/api/", "/overlay/", "/shop/cart", "/shop/checkout", "/shop/payment"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

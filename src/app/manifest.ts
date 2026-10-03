import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zberus Rift Service — Riftbound TCG Tools",
    short_name: "Zberus Rift",
    description:
      "ฐานข้อมูลการ์ด, Deck Builder, Live Overlay, Meta Report และร้านค้าการ์ด Riftbound",
    start_url: "/",
    display: "standalone",
    background_color: "#111111",
    theme_color: "#111111",
    icons: [
      { src: "/logo-192.png", sizes: "192x192", type: "image/png" },
      { src: "/logo-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

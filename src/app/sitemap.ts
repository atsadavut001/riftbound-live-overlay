import type { MetadataRoute } from "next";
import { getDataSource } from "@/lib/db";
import { Card } from "@/lib/entities/Card";
import { Deck } from "@/lib/entities/Deck";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://riftbound-live-overlay.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/cards`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/meta`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/meta/decks`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/decks`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/points-tracker`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const db = await getDataSource();

    // Every card gets its own indexable page (they are searchable & linked from meta report)
    const cards = await db
      .getRepository(Card)
      .createQueryBuilder("card")
      .select(["card.code", "card.updatedAt"])
      .getMany();

    const cardPages: MetadataRoute.Sitemap = cards.map(c => ({
      url: `${SITE_URL}/cards?card=${encodeURIComponent(c.code)}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    // Public decks
    const decks = await db
      .getRepository(Deck)
      .createQueryBuilder("deck")
      .select(["deck.id", "deck.updatedAt"])
      .where("deck.visibility = :v", { v: "Public" })
      .getMany();

    const deckPages: MetadataRoute.Sitemap = decks.map(d => ({
      url: `${SITE_URL}/decks/${d.id}`,
      lastModified: d.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticPages, ...cardPages, ...deckPages];
  } catch (e) {
    console.error("Sitemap: DB part failed, serving static pages only", e);
    return staticPages;
  }
}

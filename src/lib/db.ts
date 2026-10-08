import "reflect-metadata";
import "pg";
import { DataSource, ObjectLiteral } from "typeorm";
import { User } from "./entities/User";
import { OverlayState } from "./entities/OverlayState";
import { Card } from "./entities/Card";
import { CardTypeTemplate } from "./entities/CardTypeTemplate";
import { Issue } from "./entities/Issue";
import { Deck } from "./entities/Deck";
import { ShopItem } from "./entities/ShopItem";
import { Order } from "./entities/Order";
import { OrderItem } from "./entities/OrderItem";
import { Address } from "./entities/Address";
import { Tournament } from "./entities/Tournament";
import { TournamentStanding } from "./entities/TournamentStanding";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false, // ⚠️ MUST BE FALSE IN PRODUCTION DUE TO MINIFICATION
  logging: false,
  entities: [User, OverlayState, Card, CardTypeTemplate, Issue, Deck, ShopItem, Order, OrderItem, Address, Tournament, TournamentStanding],
  subscribers: [],
  migrations: [],
});

export const getDataSource = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    
    // Auto-migrate new columns safely without full synchronize
    try {
      await AppDataSource.query(`ALTER TABLE "shop_item" ADD COLUMN IF NOT EXISTS "highlight" boolean NOT NULL DEFAULT false`);
    } catch (e) {
      console.warn("Auto-migrate highlight column failed:", e);
    }

    // Overlay background image (user-uploaded)
    try {
      await AppDataSource.query(`ALTER TABLE "overlay_states" ADD COLUMN IF NOT EXISTS "backgroundUrl" varchar`);
    } catch (e) {
      console.warn("Auto-migrate overlay backgroundUrl column failed:", e);
    }

    // Overlay banners (user-uploaded, max 5, loops on overlay page)
    try {
      await AppDataSource.query(`ALTER TABLE "overlay_states" ADD COLUMN IF NOT EXISTS "banners" jsonb`);
    } catch (e) {
      console.warn("Auto-migrate overlay banners column failed:", e);
    }

    // Meta Report tables (TopDeck.gg sync)
    try {
      await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS "tournaments" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "tid" varchar NOT NULL UNIQUE,
          "name" varchar NOT NULL,
          "format" varchar NOT NULL DEFAULT 'Constructed',
          "swissNum" int NOT NULL DEFAULT 0,
          "topCut" int NOT NULL DEFAULT 0,
          "playerCount" int NOT NULL DEFAULT 0,
          "startDate" int,
          "location" varchar,
          "decks" jsonb NOT NULL DEFAULT '[]'::jsonb,
          "createdAt" timestamp NOT NULL DEFAULT now(),
          "updatedAt" timestamp NOT NULL DEFAULT now()
        )
      `);
      await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS "tournament_standings" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "tournamentId" uuid NOT NULL REFERENCES "tournaments"("id") ON DELETE CASCADE,
          "playerName" varchar NOT NULL,
          "leaderName" varchar,
          "placement" int,
          "wins" int NOT NULL DEFAULT 0,
          "losses" int NOT NULL DEFAULT 0,
          "draws" int NOT NULL DEFAULT 0,
          "decklist" text,
          "deckCards" jsonb NOT NULL DEFAULT '[]'::jsonb,
          "leaderCardId" uuid,
          "createdAt" timestamp NOT NULL DEFAULT now(),
          "updatedAt" timestamp NOT NULL DEFAULT now()
        )
      `);
      await AppDataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_tournament_standings_tournament_id" ON "tournament_standings" ("tournamentId")`);
      // Multiple players can share a leader in one tournament — must NOT be unique
      await AppDataSource.query(`DROP INDEX IF EXISTS "UQ_tournament_standings_tournament_leader"`);
      await AppDataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_tournament_standings_tournament_leader" ON "tournament_standings" ("tournamentId", "leaderName")`);
    } catch (e) {
      console.warn("Auto-migrate meta tables failed:", e);
    }
  }
  return AppDataSource;
};

export const getSafeRepository = async <T extends ObjectLiteral>(tableName: string) => {
  const db = await getDataSource();
  const metadata = db.entityMetadatas.find(meta => meta.tableName === tableName);
  if (!metadata) throw new Error(`Entity metadata for table ${tableName} not found`);
  return db.getRepository<T>(metadata.target);
};

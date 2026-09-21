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

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false, // ⚠️ MUST BE FALSE IN PRODUCTION DUE TO MINIFICATION
  logging: false,
  entities: [User, OverlayState, Card, CardTypeTemplate, Issue, Deck, ShopItem, Order, OrderItem, Address],
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
  }
  return AppDataSource;
};

export const getSafeRepository = async <T extends ObjectLiteral>(tableName: string) => {
  const db = await getDataSource();
  const metadata = db.entityMetadatas.find(meta => meta.tableName === tableName);
  if (!metadata) throw new Error(`Entity metadata for table ${tableName} not found`);
  return db.getRepository<T>(metadata.target);
};

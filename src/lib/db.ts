import "reflect-metadata";
import "pg";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { OverlayState } from "./entities/OverlayState";
import { Card } from "./entities/Card";
import { CardTypeTemplate } from "./entities/CardTypeTemplate";
import { Issue } from "./entities/Issue";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false, // ⚠️ MUST BE FALSE IN PRODUCTION DUE TO MINIFICATION
  logging: false,
  entities: [User, OverlayState, Card, CardTypeTemplate, Issue],
  subscribers: [],
  migrations: [],
});

export const getDataSource = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
};

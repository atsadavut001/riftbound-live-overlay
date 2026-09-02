import { DataSource } from "typeorm";
import { Deck } from "./src/lib/entities/Deck";

const ds = new DataSource({
  type: "postgres",
  url: "postgresql://postgres:postgres@localhost:5432/postgres",
  synchronize: true,
  entities: [Deck]
});

ds.initialize().then(() => {
  console.log("Deck table synced");
  process.exit(0);
}).catch(console.error);

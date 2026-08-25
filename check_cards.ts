import { config } from "dotenv";
config({ path: ".env.local" });
import { getDataSource } from "./src/lib/db";

async function run() {
  const ds = await getDataSource();
  const res = await ds.query("SELECT COUNT(*) FROM card");
  console.log("Total cards in DB:", res);
  process.exit();
}
run();

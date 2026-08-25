import { config } from "dotenv";
config({ path: ".env.local" });
import { getDataSource } from "./src/lib/db";
async function run() {
  const ds = await getDataSource();
  const res = await ds.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  console.log(res);
  process.exit();
}
run();

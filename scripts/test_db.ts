import { DataSource } from "typeorm";

const AppDataSource = new DataSource({
  type: "postgres",
  url: "postgresql://postgres.qugqegaqjrcwkxnvohvv:v3mfNWZwxyKu_V6@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgresql",
  synchronize: false,
  logging: true,
});

async function testConnection() {
  try {
    await AppDataSource.initialize();
    console.log("Connected successfully!");
    const result = await AppDataSource.query(`SELECT * FROM "users"`);
    console.log("Users:", result);
    
    const overlays = await AppDataSource.query(`SELECT * FROM "overlay_states"`);
    console.log("Overlays:", overlays);
    
  } catch (e) {
    console.error("Connection failed", e);
  } finally {
    process.exit(0);
  }
}

testConnection();

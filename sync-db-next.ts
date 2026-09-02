import { loadEnvConfig } from '@next/env';
import { DataSource } from 'typeorm';
import { Deck } from './src/lib/entities/Deck';
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  entities: [Deck]
});
ds.initialize().then(() => {
  console.log('Deck table created');
  process.exit(0);
}).catch(console.error);

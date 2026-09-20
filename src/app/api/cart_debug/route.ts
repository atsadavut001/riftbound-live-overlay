export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { ShopItem } from '@/lib/entities/ShopItem';

export async function GET() {
  const db = await getDataSource();
  const items = await db.getRepository(ShopItem).find({ relations: { card: true }});
  return NextResponse.json(items.map(i => ({ name: i.card.name, quantity: i.quantity })));
}

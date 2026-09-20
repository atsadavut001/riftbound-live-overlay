export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDataSource();
    await db.query(`ALTER TABLE shop_item ADD COLUMN IF NOT EXISTS print VARCHAR DEFAULT 'Normal';`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

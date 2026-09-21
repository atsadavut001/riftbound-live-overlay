import { NextRequest, NextResponse } from "next/server";
import { getDataSource, getSafeRepository } from "@/lib/db";
import { ShopItem } from "@/lib/entities/ShopItem";

export async function GET(req: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  try {
    const db = await getDataSource();
    const repo = (await getSafeRepository<ShopItem>("shop_item"));
    const item = await repo.findOne({ where: { cardId } });
    
    if (!item) {
      return NextResponse.json({ price: null });
    }
    
    return NextResponse.json({ price: item.price, quantity: item.quantity });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

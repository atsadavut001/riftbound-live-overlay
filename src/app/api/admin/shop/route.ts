import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { ShopItem } from "@/lib/entities/ShopItem";

export async function GET(req: NextRequest) {
  try {
    const db = await getDataSource();
    const repo = db.getRepository(ShopItem);
    const items = await repo.find({ relations: { card: true }, order: { createdAt: "DESC" } });
    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDataSource();
    const repo = db.getRepository(ShopItem);
    const body = await req.json();

    const newItem = repo.create({
      cardId: body.cardId,
      price: body.price || 0,
      quantity: body.quantity || 0,
      print: body.print || "Normal",
      highlight: body.highlight || false,
    });

    await repo.save(newItem);
    return NextResponse.json(newItem);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

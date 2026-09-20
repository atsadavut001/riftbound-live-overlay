import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { ShopItem } from "@/lib/entities/ShopItem";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = await getDataSource();
    const repo = db.getRepository(ShopItem);
    const item = await repo.findOne({ where: { id }, relations: { card: true } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = await getDataSource();
    const repo = db.getRepository(ShopItem);
    const body = await req.json();

    const item = await repo.findOne({ where: { id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Note: cardId is intentionally omitted so it cannot be updated
    repo.merge(item, {
      price: body.price,
      quantity: body.quantity,
      print: body.print
    });

    await repo.save(item);
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = await getDataSource();
    const repo = db.getRepository(ShopItem);
    const result = await repo.delete(id);
    if (result.affected === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

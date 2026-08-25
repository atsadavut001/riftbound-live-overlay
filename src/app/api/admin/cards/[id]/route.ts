import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { Card } from "@/lib/entities/Card";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = await getDataSource();
    const repo = db.getRepository(Card);
    
    const card = await repo.findOne({ where: { id } });
    if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(card);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = await getDataSource();
    const repo = db.getRepository(Card);
    const body = await req.json();

    const card = await repo.findOne({ where: { id } });
    if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

    repo.merge(card, {
      code: body.code,
      name: body.name,
      type: body.type,
      rarity: body.rarity,
      imageUrl: body.imageUrl,
      detail: body.detail
    });

    await repo.save(card);
    return NextResponse.json(card);
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ error: "Card code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = await getDataSource();
    const repo = db.getRepository(Card);
    
    const result = await repo.delete(id);
    if (result.affected === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { Deck } from "@/lib/entities/Deck";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const db = await getDataSource();
    const repo = db.getRepository(Deck);
    
    const deck = await repo.findOne({ where: { id } });
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    return NextResponse.json({ data: deck });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}


export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const db = await getDataSource();
    const repo = db.getRepository(Deck);
    
    const deck = await repo.findOne({ where: { id } });
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const { name, detail, visibility, cards, coverImageUrl } = body;
    
    deck.name = name ?? deck.name;
    deck.detail = detail ?? deck.detail;
    deck.visibility = visibility ?? deck.visibility;
    deck.cards = cards ?? deck.cards;
    deck.coverImageUrl = coverImageUrl ?? deck.coverImageUrl;

    await repo.save(deck);
    
    return NextResponse.json({ data: deck });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const db = await getDataSource();
    const repo = db.getRepository(Deck);
    
    const deck = await repo.findOne({ where: { id } });
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    await repo.remove(deck);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

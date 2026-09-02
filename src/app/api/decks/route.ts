import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { Deck } from "@/lib/entities/Deck";

export async function POST(req: NextRequest) {
  try {
    const db = await getDataSource();
    const repo = db.getRepository(Deck);
    
    // In a real app we'd get the user from session, e.g. getServerSession()
    // For now we'll just mock user "123" or accept from body
    
    const body = await req.json();
    const { name, detail, visibility, cards, coverImageUrl, userId } = body;

    if (!name || !visibility || !cards) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const deck = repo.create({
      name,
      detail,
      visibility,
      cards,
      coverImageUrl,
      userId: userId || "anonymous"
    });

    await repo.save(deck);
    return NextResponse.json({ data: deck });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = await getDataSource();
    const repo = db.getRepository(Deck);
    
    const { searchParams } = new URL(req.url);
    const visibility = searchParams.get("visibility");
    const user = searchParams.get("user");

    const query: any = {};
    if (visibility) {
      query.visibility = visibility;
    }
    if (user === "me") {
      // Mocking user id "anonymous" for now based on POST
      query.userId = "anonymous";
    }

    const decks = await repo.find({
      where: query,
      order: { createdAt: "DESC" }
    });

    return NextResponse.json({ data: decks });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

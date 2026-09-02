import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { Card } from "@/lib/entities/Card";
import { In } from "typeorm";

export async function POST(req: NextRequest) {
  try {
    const { names } = await req.json();
    
    if (!names || !Array.isArray(names)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const db = await getDataSource();
    const repo = db.getRepository(Card);

    // Fetch all matching cards
    const cards = await repo.find({
      where: { name: In(names) }
    });

    return NextResponse.json({ data: cards });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

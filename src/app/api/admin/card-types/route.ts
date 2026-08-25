import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { CardTypeTemplate } from "@/lib/entities/CardTypeTemplate";

const DEFAULT_TYPES = [
  { name: "Legend", defaultJson: { cost: 0, power: 0, health: 0 } },
  { name: "Battlefield", defaultJson: { effect: "" } },
  { name: "Unit", defaultJson: { "Color": "", "Tag": "", "Energy": "", "Power": "", "Might": "", "Ability": "", "Flavor Text": "" } },
  { name: "Gear", defaultJson: { cost: 1, equipCost: 1, effect: "" } },
  { name: "Spell", defaultJson: { cost: 1, effect: "" } },
  { name: "Rune", defaultJson: { element: "", effect: "" } },
];

export async function GET() {
  try {
    const db = await getDataSource();
    const repo = db.getRepository(CardTypeTemplate);

    let types = await repo.find();
    
    // Auto-seed defaults if empty
    if (types.length === 0) {
      for (const t of DEFAULT_TYPES) {
        const newType = repo.create(t);
        await repo.save(newType);
      }
      types = await repo.find();
    } else {
      // Force update Unit if it has the old 'cost' field
      const unitType = types.find(t => t.name === "Unit");
      if (unitType && unitType.defaultJson && typeof unitType.defaultJson.cost !== "undefined") {
        unitType.defaultJson = DEFAULT_TYPES.find(t => t.name === "Unit")!.defaultJson;
        await repo.save(unitType);
      }
    }

    return NextResponse.json(types);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDataSource();
    const repo = db.getRepository(CardTypeTemplate);
    const body = await req.json();

    const newType = repo.create({
      name: body.name,
      defaultJson: body.defaultJson || {}
    });

    await repo.save(newType);
    return NextResponse.json(newType);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

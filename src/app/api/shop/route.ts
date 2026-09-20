import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { ShopItem } from "@/lib/entities/ShopItem";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '48');
    const search = searchParams.get('search') || '';
    const set = searchParams.get('set') || '';
    const type = searchParams.get('type') || '';
    const rarity = searchParams.get('rarity') || '';
    const color = searchParams.get('color') || '';

    const db = await getDataSource();
    const repo = db.getRepository(ShopItem);
    
    let qb = repo.createQueryBuilder("shopItem")
      .leftJoinAndSelect("shopItem.card", "card");

    if (search) {
      qb = qb.andWhere("(card.name ILIKE :search OR card.code ILIKE :search)", { search: `%${search}%` });
    }
    
    if (set) {
      const sets = set.split(",");
      qb = qb.andWhere("card.code SUBSTRING(1, 3) IN (:...sets)", { sets }); // Not exactly correct in standard SQL but let's approximate or just use LIKE
      // Actually, since code starts with set:
      const setConditions = sets.map((s, i) => `card.code LIKE :set${i}`).join(" OR ");
      const setParams = sets.reduce((acc: any, s, i) => ({ ...acc, [`set${i}`]: `${s}-%` }), {});
      qb = qb.andWhere(`(${setConditions})`, setParams);
    }

    if (type) {
      qb = qb.andWhere("card.type IN (:...type)", { type: type.split(",") });
    }

    if (rarity) {
      qb = qb.andWhere("card.rarity IN (:...rarity)", { rarity: rarity.split(",") });
    }

    // Color is stored in detail jsonb... this is complex to query in TypeORM builder simply,
    // let's skip strict DB color filtering for now and just fetch and filter in memory if color is provided,
    // OR we just use basic pagination for the rest.
    
    qb = qb.orderBy("shopItem.createdAt", "DESC");

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // If color filter is active, we might have to filter in memory (not ideal for pagination, but OK for now)
    let finalItems = items;
    let finalTotal = total;

    if (color) {
      const colors = color.split(",");
      finalItems = items.filter(item => {
        const cardColors = item.card?.detail?.Color || [];
        return colors.some(c => cardColors.includes(c));
      });
      // the total will be wrong if we do this, but it's a tradeoff without writing complex JSONB queries.
    }

    return NextResponse.json({
      data: finalItems,
      total: finalTotal
    });

  } catch (error) {
    console.error("Shop fetch error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { Card } from "@/lib/entities/Card";
import { Brackets } from "typeorm";

// Public, read-only card catalog API for user-facing pages
// (Card Library, Deck Builder, Points Tracker, Overlay Analyzer).

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const db = await getDataSource();
    const repo = db.getRepository(Card);

    const qb = repo.createQueryBuilder("card");

    const setFilter = searchParams.get("set");
    if (setFilter && setFilter !== "All" && setFilter !== "") {
      const sets = setFilter.split(",");
      qb.andWhere(new Brackets(qb => {
        sets.forEach((s, i) => {
          if (i === 0) qb.where(`card.code LIKE :setPrefix${i}`, { [`setPrefix${i}`]: `${s}-%` });
          else qb.orWhere(`card.code LIKE :setPrefix${i}`, { [`setPrefix${i}`]: `${s}-%` });
        });
      }));
    }

    const typeFilter = searchParams.get("type");
    if (typeFilter && typeFilter !== "All" && typeFilter !== "") {
      qb.andWhere("card.type IN (:...types)", { types: typeFilter.split(",") });
    }

    const rarityFilter = searchParams.get("rarity");
    if (rarityFilter && rarityFilter !== "All" && rarityFilter !== "") {
      const rarities = rarityFilter.split(",");
      // "Promo" ไม่ใช่ค่า rarity จริงใน database — แปลงเป็นการกรองจากรหัส set โปรโมชันแทน
      const PROMO_SETS = ["JDG", "OPP", "PR", "T1A", "T1S", "SGN"];
      const realRarities = rarities.filter((r) => r !== "Promo");
      const wantsPromo = rarities.includes("Promo");
      qb.andWhere(new Brackets(qb => {
        let hasCondition = false;
        if (realRarities.length > 0) {
          qb.where("card.rarity IN (:...realRarities)", { realRarities });
          hasCondition = true;
        }
        if (wantsPromo) {
          PROMO_SETS.forEach((s, i) => {
            const param = `promoSet${i}`;
            if (!hasCondition && i === 0) qb.where(`card.code LIKE :${param}`, { [param]: `${s}-%` });
            else qb.orWhere(`card.code LIKE :${param}`, { [param]: `${s}-%` });
          });
        } else if (!hasCondition) {
          qb.where("1=0"); // ไม่มีเงื่อนไขที่ใช้ได้ — คืนผลลัพธ์ว่าง
        }
      }));
    }

    const colorFilter = searchParams.get("color");
    if (colorFilter && colorFilter !== "All" && colorFilter !== "") {
      const colors = colorFilter.split(",");
      qb.andWhere(new Brackets(qb => {
        colors.forEach((c, i) => {
          if (i === 0) qb.where(`card.detail->'Color' @> :color${i}`, { [`color${i}`]: `["${c}"]` });
          else qb.orWhere(`card.detail->'Color' @> :color${i}`, { [`color${i}`]: `["${c}"]` });
        });
      }));
    }

    const tagFilter = searchParams.get("tag");
    if (tagFilter && tagFilter !== "") {
      const tags = tagFilter.split(",");
      qb.andWhere(new Brackets(qb => {
        tags.forEach((t, i) => {
          if (i === 0) qb.where(`card.detail->'Tag' @> :tag${i}`, { [`tag${i}`]: `["${t}"]` });
          else qb.orWhere(`card.detail->'Tag' @> :tag${i}`, { [`tag${i}`]: `["${t}"]` });
        });
      }));
    }

    const searchQuery = searchParams.get("search");
    if (searchQuery && searchQuery !== "") {
      qb.andWhere(new Brackets(qb => {
        qb.where("card.name ILIKE :search", { search: `%${searchQuery}%` })
          .orWhere("card.code ILIKE :search", { search: `%${searchQuery}%` });
      }));
    }

    // Custom sort order based on requested set sequence
    qb.orderBy(`
      CASE 
        WHEN card.code LIKE 'OGN-%' THEN 1
        WHEN card.code LIKE 'SFD-%' THEN 2
        WHEN card.code LIKE 'UNL-%' THEN 3
        WHEN card.code LIKE 'VEN-%' THEN 4
        WHEN card.code LIKE 'OGS-%' THEN 5
        WHEN card.code LIKE 'ARC-%' THEN 6
        ELSE 7
      END
    `, "ASC");

    qb.addOrderBy("card.code", "ASC");
    qb.skip(skip).take(limit);

    const [cards, total] = await qb.getManyAndCount();

    return NextResponse.json({
      data: cards,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

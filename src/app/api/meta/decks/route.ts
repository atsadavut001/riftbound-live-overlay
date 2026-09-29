import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { TournamentStanding } from "@/lib/entities/TournamentStanding";

/**
 * GET /api/meta/decks?leader=Irelia&limit=30
 *
 * Lists tournament decks (from published standings) ordered by recency and
 * placement. Filter by leader (base legend name) when provided; otherwise
 * returns the best-finishing decks across all leaders.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leader = searchParams.get("leader")?.trim();
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30")));

    const db = await getDataSource();
    const sRepo = db.getRepository(TournamentStanding);

    // Raw query joins tournaments (name/date) and cards (leader image)
    const rows = await sRepo
      .createQueryBuilder("standing")
      .innerJoin("tournaments", "t", "t.id = standing.tournamentId")
      .leftJoin("card", "c", "c.id = standing.leaderCardId")
      .select("standing.id", "id")
      .addSelect("standing.tournamentId", "tournamentId")
      .addSelect("t.name", "tournamentName")
      .addSelect("t.startDate", "tournamentDate")
      .addSelect("standing.playerName", "playerName")
      .addSelect("standing.placement", "placement")
      .addSelect("standing.wins", "wins")
      .addSelect("standing.losses", "losses")
      .addSelect("standing.leaderName", "leaderName")
      .addSelect("c.imageUrl", "leaderImageUrl")
      .addSelect("standing.deckCards", "deckCards")
      .where("standing.leaderName IS NOT NULL")
      .andWhere("JSONB_ARRAY_LENGTH(standing.deckCards) > 0")
      .orderBy("t.startDate", "DESC")
      .addOrderBy("standing.placement", "ASC")
      .limit(limit);

    if (leader) {
      rows.andWhere("standing.leaderName = :leader", { leader });
    }

    const raw = await rows.getRawMany();

    const decks = raw.map(r => ({
      id: `${r.tournamentId}__${encodeURIComponent(r.playerName)}`,
      tournamentId: r.tournamentId,
      tournamentName: r.tournamentName || "Unknown Tournament",
      tournamentDate: r.tournamentDate || null,
      playerName: r.playerName,
      placement: r.placement,
      wins: r.wins,
      losses: r.losses,
      leaderName: r.leaderName,
      leaderImageUrl: r.leaderImageUrl || null,
      deckCardCount: Array.isArray(r.deckCards)
        ? (r.deckCards as { qty?: number }[]).reduce((acc, c) => acc + (c.qty || 0), 0)
        : 0,
    }));

    return NextResponse.json({ data: decks, total: decks.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

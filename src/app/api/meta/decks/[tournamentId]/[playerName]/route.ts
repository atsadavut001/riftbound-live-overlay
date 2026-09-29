import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { TournamentStanding } from "@/lib/entities/TournamentStanding";
import { Tournament } from "@/lib/entities/Tournament";
import { Card } from "@/lib/entities/Card";

/**
 * GET /api/meta/decks/{tournamentId}/{playerName}
 * Returns one tournament deck: standings info + resolved card objects
 * (matched against the local Card table by code, then name), grouped into
 * legend / champion / battlefields / runes / mainDeck / sideboard.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tournamentId: string; playerName: string }> }
) {
  try {
    const { tournamentId, playerName } = await context.params;
    const decodedName = decodeURIComponent(playerName);

    const db = await getDataSource();
    const sRepo = db.getRepository(TournamentStanding);
    const cardRepo = db.getRepository(Card);

    const standing = await sRepo.findOne({
      where: { tournamentId, playerName: decodedName },
    });
    if (!standing) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const tournament = await db.getRepository(Tournament).findOne({
      where: { id: tournamentId },
    });

    const deckCards: { code?: string | null; name: string; qty: number; cat?: string }[] =
      Array.isArray(standing.deckCards) ? standing.deckCards : [];

    // Resolve every entry to a full Card object (by exact code first, then name)
    const codes = [...new Set(deckCards.map(c => c.code).filter(Boolean))] as string[];
    const names = [...new Set(deckCards.map(c => c.name).filter(Boolean))];

    const byCode = new Map<string, Card>();
    if (codes.length) {
      const cards = await cardRepo
        .createQueryBuilder("card")
        .where("card.code IN (:...codes)", { codes })
        .getMany();
      for (const c of cards) if (!byCode.has(c.code)) byCode.set(c.code, c);
    }

    const byName = new Map<string, Card>();
    if (names.length) {
      const cards = await cardRepo
        .createQueryBuilder("card")
        .where("card.name IN (:...names)", { names })
        .getMany();
      for (const c of cards) if (!byName.has(c.name)) byName.set(c.name, c);
    }

    const resolveCard = (entry: { code?: string | null; name: string; qty: number }) => {
      const card = (entry.code ? byCode.get(entry.code) : undefined) || byName.get(entry.name);
      return card ? { ...card, qty: entry.qty } : null;
    };
    const lookup = (entry: { code?: string | null; name: string }) =>
      (entry.code ? byCode.get(entry.code) : undefined) || byName.get(entry.name);

    // Group by stored TopDeck category first; fall back to card type
    const pickByCat = (cat: string) =>
      deckCards.filter(c => c.cat?.toLowerCase() === cat.toLowerCase());

    const legendEntries = pickByCat("Legend");
    const championEntries = pickByCat("Champion");
    const battlefieldEntries = pickByCat("Battlefields");
    const runeEntries = pickByCat("Runes");
    const mainboardEntries = pickByCat("Mainboard");
    const sideboardEntries = pickByCat("Sideboard");

    const legendCard = legendEntries[0] ? resolveCard(legendEntries[0]) : null;
    const championCard = championEntries[0] ? resolveCard(championEntries[0]) : null;

    const battlefields = battlefieldEntries.map(resolveCard).filter(Boolean);
    const runes = runeEntries.map(resolveCard).filter(Boolean);

    const usedInOtherSections = new Set<string>(
      [...legendEntries, ...championEntries, ...battlefieldEntries, ...runeEntries].map(e => e.name)
    );

    const isMaindeckable = (entry: { code?: string | null; name: string }) => {
      const card = lookup(entry);
      if (!card) return false;
      return !["Legend", "Champion", "Battlefield", "Rune"].includes(card.type);
    };

    const mainDeck = (mainboardEntries.length > 0
      ? mainboardEntries
      : deckCards.filter(
          c =>
            !usedInOtherSections.has(c.name) &&
            isMaindeckable(c)
        )
    )
      .map(resolveCard)
      .filter(Boolean);

    const sideboard = sideboardEntries.map(resolveCard).filter(Boolean);

    return NextResponse.json({
      data: {
        tournament: tournament
          ? { id: tournament.id, name: tournament.name, startDate: tournament.startDate, location: tournament.location }
          : null,
        player: {
          name: standing.playerName,
          placement: standing.placement,
          wins: standing.wins,
          losses: standing.losses,
          draws: standing.draws,
        },
        leader: legendCard,
        champion: championCard,
        battlefields,
        runes,
        mainDeck,
        sideboard,
        decklistText: standing.decklist,
        unresolvedCount: deckCards.length - ([
          legendCard,
          championCard,
          ...battlefields,
          ...runes,
          ...mainDeck,
          ...sideboard,
        ].filter(Boolean).length),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { Tournament } from "@/lib/entities/Tournament";
import { TournamentStanding } from "@/lib/entities/TournamentStanding";
import { Card } from "@/lib/entities/Card";
import { MetaSyncLog } from "@/lib/entities/MetaSyncLog";
import { requireAdmin } from "@/lib/auth";
import { fetchTopDeckTournaments, normalizeLeader, parseDecklist, flattenDeckObj, leaderFromDeckObj } from "@/lib/topdeck";

/**
 * POST /api/admin/meta/sync (admin session)
 * GET /api/admin/meta/sync (Vercel Cron, Authorization: Bearer CRON_SECRET)
 * Body: { last?: number (days back, default 30), format?: string (default "Constructed") }
 * Fetches completed Riftbound tournaments from TopDeck.gg and upserts them locally.
 */
async function isAuthorized(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`) return true;
  return (await requireAdmin()) !== null;
}

export async function GET(req: NextRequest) {
  return runSync(req);
}

export async function POST(req: NextRequest) {
  return runSync(req);
}

async function runSync(req: NextRequest) {
  if (!(await isAuthorized(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const startedAt = Date.now();
  const trigger = req.headers.get("authorization")?.startsWith("Bearer ") ? "cron" : "manual";
  let last = 30;
  let format = "Constructed";

  try {
    const body = await req.json().catch(() => ({}));
    last = typeof body.last === "number" ? body.last : 30;
    format = typeof body.format === "string" ? body.format : "Constructed";

    const tournaments = await fetchTopDeckTournaments({ last, format });

    const db = await getDataSource();
    const tRepo = db.getRepository(Tournament);
    const sRepo = db.getRepository(TournamentStanding);
    const cardRepo = db.getRepository(Card);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const td of tournaments) {
      if (!td?.TID) {
        skipped++;
        continue;
      }

      try {
        // Skip tournaments with no standings/decks at all
        const standings = Array.isArray(td.standings) ? td.standings : [];
        if (standings.length === 0) {
          skipped++;
          continue;
        }
        // Only keep tournaments where decks are public (leader info available)
        const rowsWithDeck = standings.filter(s => s.leader || s.deckObj?.Legend);
        if (rowsWithDeck.length === 0) {
          skipped++;
          continue;
        }

        // Upsert tournament
        let tournament = await tRepo.findOne({ where: { tid: td.TID } });
        if (!tournament) {
          tournament = tRepo.create({ tid: td.TID });
          created++;
        } else {
          updated++;
        }

        tournament.name = td.tournamentName || td.TID;
        tournament.format = td.format || format;
        tournament.swissNum = td.swissNum ?? 0;
        tournament.topCut = td.topCut ?? 0;
        tournament.playerCount = standings.length;
        tournament.startDate = td.startDate ?? null;
        tournament.location = [td.eventData?.city, td.eventData?.state].filter(Boolean).join(", ") || null;

        // Build standings rows (one per player+leader)
        const standingRows: { row: Partial<TournamentStanding>; legendFullName: string | null }[] = [];
        const decksPayload: { player: string; leader: string; placement: number | null; decklist: string | null }[] = [];
        const leaderNames = new Set<string>();
        const leaderFullNames = new Set<string>();

        standings.forEach((s, idx) => {
          const leaderNorm = normalizeLeader(s.leader) || leaderFromDeckObj(s.deckObj) || "";
          if (!leaderNorm) return; // no deck published for this player

          // Full legend card name from deckObj (e.g. "Akali, Rogue Assassin") matches Card.name
          const legendFullName = s.deckObj?.Legend ? Object.keys(s.deckObj.Legend)[0]?.trim() || null : null;

          const parsedCards = s.deckObj
            ? flattenDeckObj(s.deckObj)
            : parseDecklist(s.decklist).map(c => ({ code: null, name: c.name, qty: c.qty }));

          const row = {
            playerName: s.name || `Player ${idx + 1}`,
            leaderName: leaderNorm,
            placement: s.rank ?? s.place ?? (idx + 1),
            wins: s.wins ?? 0,
            losses: s.losses ?? 0,
            draws: s.draws ?? 0,
            decklist: s.decklist ?? null,
            deckCards: parsedCards,
          };

          leaderNames.add(row.leaderName);
          if (legendFullName) leaderFullNames.add(legendFullName);
          standingRows.push({ row, legendFullName });
          decksPayload.push({
            player: row.playerName,
            leader: row.leaderName,
            placement: row.placement,
            decklist: row.decklist,
          });
        });

        if (standingRows.length === 0) {
          skipped++;
          continue;
        }

        tournament.playerCount = standingRows.length;
        tournament.decks = decksPayload;
        await tRepo.save(tournament);

        // Resolve leader card ids: match full names first ("Akali, Rogue Assassin"),
        // then fall back to base names ("Akali")
        const baseList = Array.from(leaderNames);
        const fullList = Array.from(leaderFullNames);
        const searchNames = [...new Set([...baseList, ...fullList])];
        const leaderCards = searchNames.length
          ? await cardRepo
              .createQueryBuilder("card")
              .where("card.type = :type", { type: "Legend" })
              .andWhere("card.name IN (:...names)", { names: searchNames })
              .getMany()
          : [];
        // Prefer cards with images; keep first occurrence per name
        const byName = new Map<string, Card>();
        for (const c of leaderCards) {
          const existing = byName.get(c.name);
          if (!existing || (!existing.imageUrl && c.imageUrl)) byName.set(c.name, c);
        }
        const baseMap = new Map(baseList.map(n => {
          const direct = byName.get(n);
          const viaFull = fullList.find(f => normalizeLeader(f) === n);
          return [n, (direct || (viaFull ? byName.get(viaFull) : undefined))?.id ?? null];
        }));

        // Replace standings for this tournament
        await sRepo.delete({ tournamentId: tournament.id });
        for (const { row, legendFullName } of standingRows) {
          const standing = sRepo.create({
            tournamentId: tournament.id,
            playerName: row.playerName!,
            leaderName: row.leaderName,
            placement: row.placement ?? null,
            wins: row.wins ?? 0,
            losses: row.losses ?? 0,
            draws: row.draws ?? 0,
            decklist: row.decklist ?? null,
            deckCards: row.deckCards ?? [],
            leaderCardId:
              (legendFullName ? byName.get(legendFullName)?.id : undefined) ??
              baseMap.get(row.leaderName!) ??
              null,
          });
          await sRepo.save(standing);
        }


      } catch (e) {
        errors.push(`${td?.TID || "unknown"}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    await logSync({
      status: "success",
      trigger,
      format,
      last,
      total: tournaments.length,
      created,
      updated,
      skipped,
      errors,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      ok: true,
      total: tournaments.length,
      created,
      updated,
      skipped,
      errors,
    });
  } catch (error) {
    console.error("TopDeck sync failed:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    await logSync({
      status: "failed",
      trigger,
      format,
      last,
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [message],
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Best-effort: a logging failure must not change the sync result. */
async function logSync(entry: Omit<MetaSyncLog, "id" | "createdAt">) {
  try {
    const db = await getDataSource();
    await db.getRepository(MetaSyncLog).save(db.getRepository(MetaSyncLog).create(entry));
  } catch (e) {
    console.warn("Failed to write meta sync log:", e);
  }
}

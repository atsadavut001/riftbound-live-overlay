import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";
import { TournamentStanding } from "@/lib/entities/TournamentStanding";
import { Tournament } from "@/lib/entities/Tournament";
import { Card } from "@/lib/entities/Card";

/**
 * GET /api/meta?days=30&format=Constructed&minDecks=5
 *
 * Aggregates local tournament standings into a per-leader meta report:
 * - decks: number of deck entries using this legend
 * - winRate: average over tournaments where the legend was played
 * - top8s / firsts: conversion stats
 * - trend: play share change vs the previous equal-length window
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") || "30")));
    const format = searchParams.get("format") || "Constructed";
    const minDecks = Math.max(1, parseInt(searchParams.get("minDecks") || "5"));

    const db = await getDataSource();
    const sRepo = db.getRepository(TournamentStanding);

    const nowSec = Math.floor(Date.now() / 1000);
    const startSec = nowSec - days * 86400;
    const prevStartSec = startSec - days * 86400;

    // Current window
    const rows = await sRepo
      .createQueryBuilder("standing")
      .innerJoin(Tournament, "t", "t.id = standing.tournamentId")
      .where("t.format = :format", { format })
      .andWhere("t.startDate >= :start", { start: startSec })
      .andWhere("t.startDate <= :end", { end: nowSec })
      .getMany();

    // Previous window (for trend)
    const prevRows = await sRepo
      .createQueryBuilder("standing")
      .innerJoin(Tournament, "t", "t.id = standing.tournamentId")
      .where("t.format = :format", { format })
      .andWhere("t.startDate >= :start", { start: prevStartSec })
      .andWhere("t.startDate < :end", { end: startSec })
      .getMany();

    if (rows.length === 0) {
      return NextResponse.json({
        days,
        format,
        totalDecks: 0,
        tournamentCount: 0,
        leaders: [],
        note: "No data yet — sync tournaments from the admin panel first.",
      });
    }

    const tournamentIds = new Set(rows.map(r => r.tournamentId));

    // Map leaderName -> leaderCardId (stored during sync; already matched against Card table)
    const leaderCardIds = new Map<string, string>();
    for (const r of rows) {
      const key = r.leaderName || "Unknown";
      if (r.leaderCardId && !leaderCardIds.has(key)) leaderCardIds.set(key, r.leaderCardId);
    }

    interface Agg {
      decks: number;
      wins: number;
      losses: number;
      draws: number;
      top8s: number;
      firsts: number;
      perTournament: Map<string, { wins: number; games: number }>;
    }
    const agg = new Map<string, Agg>();
    for (const r of rows) {
      const key = r.leaderName || "Unknown";
      let a = agg.get(key);
      if (!a) {
        a = { decks: 0, wins: 0, losses: 0, draws: 0, top8s: 0, firsts: 0, perTournament: new Map() };
        agg.set(key, a);
      }
      a.decks++;
      a.wins += r.wins || 0;
      a.losses += r.losses || 0;
      a.draws += r.draws || 0;
      if (r.placement !== null && r.placement <= 8) a.top8s++;
      if (r.placement === 1) a.firsts++;
      const pt = a.perTournament.get(r.tournamentId) || { wins: 0, games: 0 };
      pt.wins += r.wins || 0;
      pt.games += (r.wins || 0) + (r.losses || 0) + (r.draws || 0);
      a.perTournament.set(r.tournamentId, pt);
    }

    const prevAgg = new Map<string, number>();
    for (const r of prevRows) {
      const key = r.leaderName || "Unknown";
      prevAgg.set(key, (prevAgg.get(key) || 0) + 1);
    }

    const totalDecks = rows.length;

    // Resolve legend card info (image etc.) via stored leaderCardId
    const cardIdList = [...new Set([...leaderCardIds.values()])];
    const cards = cardIdList.length
      ? await db.getRepository(Card)
          .createQueryBuilder("card")
          .where("card.id IN (:...ids)", { ids: cardIdList })
          .getMany()
      : [];
    const cardById = new Map(cards.map(c => [c.id, c]));

    const leaders = Array.from(agg.entries())
      .filter(([name]) => name !== "Unknown")
      .map(([name, a]) => {
        const games = a.wins + a.losses + a.draws;
        const matchWinRate = a.perTournament.size
          ? Array.from(a.perTournament.values()).reduce((acc, pt) => acc + (pt.games > 0 ? pt.wins / pt.games : 0), 0) / a.perTournament.size
          : 0;
        const card = (() => {
          const id = leaderCardIds.get(name);
          return id ? cardById.get(id) : undefined;
        })();
        const prevCount = prevAgg.get(name) || 0;
        const prevShare = prevRows.length > 0 ? prevCount / prevRows.length : 0;
        const share = totalDecks > 0 ? a.decks / totalDecks : 0;
        return {
          leader: name,
          cardId: card?.id || null,
          imageUrl: card?.imageUrl || null,
          decks: a.decks,
          playRate: Math.round(share * 1000) / 10, // %
          trend: Math.round((share - prevShare) * 1000) / 10, // pp change
          matchWinRate: Math.round(matchWinRate * 1000) / 10, // %
          gameWinRate: games > 0 ? Math.round((a.wins / games) * 1000) / 10 : 0,
          top8s: a.top8s,
          firsts: a.firsts,
        };
      })
      .filter(l => l.decks >= minDecks)
      .sort((x, y) => y.playRate - x.playRate || y.matchWinRate - x.matchWinRate);

    return NextResponse.json({
      days,
      format,
      totalDecks,
      tournamentCount: tournamentIds.size,
      leaders,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

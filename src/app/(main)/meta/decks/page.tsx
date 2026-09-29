"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface DeckSummary {
  id: string;
  tournamentId: string;
  tournamentName: string;
  tournamentDate: number | null;
  playerName: string;
  placement: number | null;
  wins: number;
  losses: number;
  leaderName: string;
  leaderImageUrl: string | null;
  deckCardCount: number;
}

interface LeaderStat {
  leader: string;
  playRate: number;
  matchWinRate: number;
}

function MetaDecksContent() {
  const searchParams = useSearchParams();
  const initialLeader = searchParams.get("leader") || "";

  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [leaders, setLeaders] = useState<LeaderStat[]>([]);
  const [leaderFilter, setLeaderFilter] = useState(initialLeader);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const [decksRes, metaRes] = await Promise.all([
          fetch("/api/meta/decks?limit=100"),
          fetch("/api/meta?days=30&minDecks=1"),
        ]);
        if (!decksRes.ok) throw new Error("Failed to load decks");
        const decksJson = await decksRes.json();
        if (!cancelled) setDecks(decksJson.data || []);
        if (metaRes.ok) {
          const metaJson = await metaRes.json();
          if (!cancelled) setLeaders(metaJson.leaders || []);
        }
  } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [initialLeader]);

  // Client-side filter combined with server filter
  const filtered = useMemo(() => {
    return decks.filter(d => {
      if (leaderFilter && d.leaderName !== leaderFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (
          !d.playerName.toLowerCase().includes(q) &&
          !d.tournamentName.toLowerCase().includes(q) &&
          !d.leaderName.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [decks, leaderFilter, searchTerm]);

  const placementBadge = (p: number | null) => {
    if (p === 1) return { text: "🏆 1st", cls: "bg-amber-500/15 text-amber-400 border-amber-500/40" };
    if (p === 2) return { text: "🥈 2nd", cls: "bg-gray-400/15 text-gray-300 border-gray-400/40" };
    if (p === 3) return { text: "🥉 3rd", cls: "bg-orange-500/15 text-orange-400 border-orange-500/40" };
    if (p !== null && p <= 8) return { text: `Top ${p}`, cls: "bg-blue-500/15 text-blue-400 border-blue-500/40" };
    return { text: `#${p ?? "-"}`, cls: "bg-gray-700/40 text-gray-400 border-gray-600/40" };
  };

  return (
    <div className="flex-1 flex flex-col p-8 sm:p-12 max-w-6xl mx-auto w-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/meta" className="hover:text-[var(--primary)]">← Meta Report</Link>
          </div>
          <h1 className="text-4xl font-bold mb-2">เด็คยอดนิยม</h1>
          <p className="text-gray-400 text-sm">เด็คจากทัวร์นาเมนต์จริง เรียงตามผลการแข่งและความล่าสุด — คลิกเพื่อดู decklist เต็ม</p>
        </div>
      </div>

      {/* Search and Filters — same look as Decks Library */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อผู้เล่น / ทัวร์นาเมนต์ / Legend..."
              className="w-full bg-[#111] border border-[#333] rounded-md pl-10 pr-4 py-2 text-sm outline-none focus:border-[#a58d4a] transition-colors"
            />
          </div>
        </div>
        {/* Legend quick filter chips */}
        {leaders.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setLeaderFilter("")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!leaderFilter ? "bg-[#a58d4a] text-white border-[#a58d4a]" : "bg-[#111] text-gray-400 border-[#333] hover:text-white"}`}
            >
              ทั้งหมด
              </button>              {leaders.slice(0, 12).map(l => (
                <button
                  key={l.leader}
                  onClick={() => setLeaderFilter(leaderFilter === l.leader ? "" : l.leader)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${leaderFilter === l.leader ? "bg-[#a58d4a] text-white border-[#a58d4a]" : "bg-[#111] text-gray-400 border-[#333] hover:text-white"}`}
                >
                  {l.leader}
                </button>
              ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-gray-500">Loading decks...</div>
      ) : error ? (
        <div className="flex justify-center p-12 text-red-400 bg-[#1a1a1a] border border-[#333] rounded-xl">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="flex justify-center p-12 text-gray-500 bg-[#1a1a1a] border border-[#333] rounded-xl">No decks found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(d => {
            const badge = placementBadge(d.placement);
            return (
              <Link
                href={`/meta/decks/${d.tournamentId}/${encodeURIComponent(d.playerName)}`}
                key={d.id}
                className="bg-[#1a1a1a] border border-[#333] rounded-xl flex overflow-hidden hover:border-[#555] transition-colors cursor-pointer group"
              >
                <div className="w-[100px] sm:w-[130px] shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1a1a1a] z-10 pointer-events-none"></div>
                  <img
                    src={d.leaderImageUrl || "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100%\" height=\"100%\" viewBox=\"0 0 200 300\"><rect width=\"200\" height=\"300\" fill=\"%23222\"/></svg>"}
                    alt={d.leaderName}
                    className="w-full h-full object-cover object-left-top transform group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100%\" height=\"100%\" viewBox=\"0 0 200 300\"><rect width=\"200\" height=\"300\" fill=\"%23222\"/></svg>"; }}
                  />
                </div>

                <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="font-bold text-sm sm:text-base text-white truncate" title={d.leaderName}>{d.leaderName}</h3>
                      <div className={`text-xs px-2 py-0.5 rounded border shrink-0 ${badge.cls}`}>{badge.text}</div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3 flex-wrap">
                      <span className="truncate max-w-[120px]">👤 {d.playerName}</span>
                      <span>·</span>
                      <span>{d.wins}W-{d.losses}L</span>
                      <span>·</span>
                      <span>{d.deckCardCount} Cards</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
                      🏟 {d.tournamentName}
                      {d.tournamentDate ? ` · ${new Date(d.tournamentDate * 1000).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MetaDecksPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12 text-gray-500">Loading...</div>}>
      <MetaDecksContent />
    </Suspense>
  );
}

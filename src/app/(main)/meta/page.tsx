"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface LeaderStat {
  leader: string;
  cardId: string | null;
  imageUrl: string | null;
  decks: number;
  playRate: number;
  trend: number;
  matchWinRate: number;
  gameWinRate: number;
  top8s: number;
  firsts: number;
}

interface MetaData {
  days: number;
  format: string;
  totalDecks: number;
  tournamentCount: number;
  leaders: LeaderStat[];
  note?: string;
}

type Tier = "S" | "A" | "B" | "C" | "D";

/**
 * Tier assignment based on tournament stats.
 * Standard tier-list order: S is the highest tier (above A), then A > B > C > D.
 *
 * Rules:
 * - S: top of the field — strong play share AND above-average win rate (or clearly above 53%)
 * - A: widely played (top quartile share) or performing well (52%+ win rate)
 * - B: solid meta presence
 * - C: niche — at least a few results
 * - D: fringe — barely appears
 */
function assignTier(l: LeaderStat, medianPlayRate: number): Tier {
  if (l.playRate >= Math.max(2 * medianPlayRate, 6) && (l.matchWinRate >= 52 || l.matchWinRate >= 53)) return "S";
  if (l.playRate >= Math.max(1.5 * medianPlayRate, 4) || l.matchWinRate >= 52) return "A";
  if (l.playRate >= medianPlayRate) return "B";
  if (l.playRate >= Math.max(medianPlayRate / 2, 1.5)) return "C";
  return "D";
}

const TIER_STYLE: Record<Tier, { text: string; bg: string; border: string; label: string }> = {
  S: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/50", label: "S — พิฆาตเมตา เล่นได้ชนะจริง" },
  A: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/40", label: "A — แข็งแกร่ง เลือกเล่นได้เสมอ" },
  B: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/40", label: "B — ระดับกลาง มีจุดแข็งชัดเจน" },
  C: { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/40", label: "C — นิยมเล่นน้อย ต้องมีฝีมือ" },
  D: { text: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/40", label: "D — หายากในเมตาปัจจุบัน" },
};

const TIER_ORDER: Tier[] = ["S", "A", "B", "C", "D"];

export default function MetaReportPage() {
  const [days, setDays] = useState(30);
  const [minDecks, setMinDecks] = useState(5);
  const [view, setView] = useState<"tier" | "list">("tier");
  const [data, setData] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetchMeta = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/meta?days=${days}&minDecks=${minDecks}`);
        if (!res.ok) throw new Error("Failed to load meta data");
        const json: MetaData = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchMeta();
    return () => {
      cancelled = true;
    };
  }, [days, minDecks]);

  const leaders = data?.leaders ?? [];
  const medianPlayRate =
    leaders.length > 0 ? leaders.map(l => l.playRate)[Math.floor(leaders.length / 2)] : 0;

  const tierGroups = TIER_ORDER.map(tier => ({
    tier,
    items: leaders.filter(l => assignTier(l, medianPlayRate) === tier),
  })).filter(g => g.items.length > 0);

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--primary)]">Meta Report</h1>
          <p className="text-gray-400 mt-2 text-sm">
            สรุปเมตาเกม Riftbound จากผลทัวร์นาเมนต์จริง — Play Rate และ Win Rate ต่อ Legend
          </p>
        </div>
        <div className="flex gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">ช่วงเวลา</label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="bg-[#111] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value={7}>7 วัน</option>
              <option value={14}>14 วัน</option>
              <option value={30}>30 วัน</option>
              <option value={90}>90 วัน</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">ขั้นต่ำเด็ค</label>
            <select
              value={minDecks}
              onChange={(e) => setMinDecks(parseInt(e.target.value))}
              className="bg-[#111] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value={1}>ทั้งหมด</option>
              <option value={3}>3+</option>
              <option value={5}>5+</option>
              <option value={10}>10+</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">กำลังโหลดข้อมูล...</div>
      ) : error ? (
        <div className="text-center text-red-400 py-16">{error}</div>
      ) : !data || data.leaders.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
          <p className="mb-2">ยังไม่มีข้อมูลเมตาในช่วงนี้</p>
          <p className="text-sm text-gray-500">
            แอดมินสามารถซิงก์ข้อมูลทัวร์นาเมนต์ได้ที่ Admin Panel → Meta Sync
          </p>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{data.tournamentCount}</div>
              <div className="text-xs text-gray-400">ทัวร์นาเมนต์</div>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{data.totalDecks}</div>
              <div className="text-xs text-gray-400">เด็คทั้งหมด</div>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 col-span-2 sm:col-span-1">
              <div className="text-2xl font-bold text-white">{data.leaders.length}</div>
              <div className="text-xs text-gray-400">Legend ที่ถูกใช้</div>
            </div>
          </div>

          {/* Popular decks shortcut */}
          <div className="flex justify-end mb-4">
            <Link
              href="/meta/decks"
              className="inline-flex items-center gap-2 bg-[var(--surface)] hover:border-[var(--primary)] border border-[var(--border)] text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              🃏 เด็คยอดนิยม
              <span className="text-gray-500">→</span>
            </Link>
          </div>

          {/* View toggle */}
          <div className="flex justify-end mb-4">
            <div className="inline-flex rounded-lg border border-[var(--border)] overflow-hidden">
              <button
                onClick={() => setView("tier")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${view === "tier" ? "bg-[var(--primary)] text-white" : "bg-[#111] text-gray-400 hover:text-white"}`}
              >
                🏆 Tier Grid
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${view === "list" ? "bg-[var(--primary)] text-white" : "bg-[#111] text-gray-400 hover:text-white"}`}
              >
                📋 List
              </button>
            </div>
          </div>

          {view === "tier" ? (
            /* ---------- Tier Grid: tier column left, legend images right ---------- */
            <div className="space-y-2">
              {tierGroups.map(({ tier, items }) => {
                const style = TIER_STYLE[tier];
                return (
                  <div
                    key={tier}
                    className="flex rounded-lg overflow-hidden border border-[var(--border)] bg-[#111]"
                  >
                    {/* Tier column (left) */}
                    <div className={`w-16 sm:w-24 shrink-0 flex flex-col items-center justify-center border-r ${style.border} ${style.bg}`}>
                      <span className={`text-3xl sm:text-5xl font-black ${style.text}`}>{tier}</span>
                      <span className="hidden sm:block text-[10px] text-gray-500 mt-1">{items.length} Legend</span>
                    </div>
                    {/* Legend cards (right) — click filters popular decks by this leader */}
                    <div className="flex-1 flex flex-wrap gap-2 p-3 items-start">
                      {items.map(l => (
                        <Link
                          key={l.leader}
                          href={`/meta/decks?leader=${encodeURIComponent(l.leader)}`}
                          title={`${l.leader} — ${l.playRate}% play rate, ${l.matchWinRate}% win rate — คลิกเพื่อดูเด็คยอดนิยม`}
                          className="group relative w-[72px] sm:w-20"
                        >
                          {l.imageUrl ? (
                            <img
                              src={l.imageUrl}
                              alt={l.leader}
                              className="w-full aspect-[2/3] object-cover rounded-md border border-[#333] group-hover:border-[var(--primary)] transition-colors"
                            />
                          ) : (
                            <div className="w-full aspect-[2/3] rounded-md border border-[#333] bg-[var(--surface)] flex items-center justify-center text-center text-[10px] text-gray-500 p-1">
                              {l.leader}
                            </div>
                          )}
                          <div className="mt-1 text-[10px] text-gray-400 truncate">{l.leader}</div>
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-gray-500">{l.playRate}%</span>
                            <span className={l.matchWinRate >= 52 ? "text-green-400" : l.matchWinRate >= 48 ? "text-gray-400" : "text-red-400"}>
                              {l.matchWinRate}%
                            </span>
                            {l.trend !== 0 && (
                              <span className={l.trend > 0 ? "text-green-400" : "text-red-400"}>
                                {l.trend > 0 ? "▲" : "▼"}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Legend for tier criteria */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                {TIER_ORDER.map(tier => (
                  <div key={tier} className={`rounded-lg border p-3 text-xs ${TIER_STYLE[tier].border} ${TIER_STYLE[tier].bg} ${TIER_STYLE[tier].text}`}>
                    <span className="font-bold text-sm">{tier}</span> — <span className="text-gray-400">{TIER_STYLE[tier].label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ---------- List view: previous detailed ranking ---------- */
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <div className="space-y-2">
                {leaders.map((l, i) => {
                  const tier = assignTier(l, medianPlayRate);
                  const style = TIER_STYLE[tier];
                  return (
                    <div
                      key={l.leader}
                      className="flex items-center gap-4 p-3 rounded-lg bg-[#111] border border-[var(--border)] hover:border-[#444] transition-colors"
                    >
                      <div className={`w-10 h-10 shrink-0 rounded-lg border flex items-center justify-center font-black text-lg ${style.bg} ${style.text} ${style.border}`}>
                        {tier}
                      </div>
                      <span className="text-xs text-gray-500 w-6 text-right">#{i + 1}</span>
                      {l.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.imageUrl} alt={l.leader} className="w-9 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-9 h-12 bg-[#1a1a1a] rounded" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link href={`/cards?search=${encodeURIComponent(l.leader)}`} className="font-medium text-white truncate hover:text-[var(--primary)]">
                            {l.leader}
                          </Link>
                          {l.trend !== 0 && (
                            <span className={`text-xs font-medium ${l.trend > 0 ? "text-green-400" : "text-red-400"}`}>
                              {l.trend > 0 ? "▲" : "▼"} {Math.abs(l.trend)}pp
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 bg-[#1a1a1a] rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[var(--primary)] to-blue-400 rounded-full"
                            style={{ width: `${Math.max(4, (l.playRate / (leaders[0]?.playRate || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0 hidden sm:block">
                        <div className="text-sm font-mono text-gray-300">{l.playRate}%</div>
                        <div className="text-[10px] text-gray-500">Play Rate</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-mono ${l.matchWinRate >= 52 ? "text-green-400" : l.matchWinRate >= 48 ? "text-gray-300" : "text-red-400"}`}>
                          {l.matchWinRate}%
                        </div>
                        <div className="text-[10px] text-gray-500">Win Rate</div>
                      </div>
                      <div className="text-right shrink-0 hidden md:block">
                        <div className="text-sm font-mono text-gray-300">{l.decks}</div>
                        <div className="text-[10px] text-gray-500">เด็ค</div>
                      </div>
                      <div className="text-right shrink-0 hidden md:block">
                        <div className="text-sm font-mono text-amber-400">{l.firsts}</div>
                        <div className="text-[10px] text-gray-500">ชนะ</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center mt-8">
            ข้อมูลจากผลทัวร์นาเมนต์ Riftbound ล่าสุด {data.days} วัน ·{" "}
            <a
              href="https://topdeck.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-300"
            >
              Data provided by TopDeck.gg
            </a>
          </p>
        </>
      )}
    </div>
  );
}

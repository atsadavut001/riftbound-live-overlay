"use client";

import CardModal from "@/components/CardModal";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { buildAtlasDeckCode } from "@/lib/riftatlas";

const groupCards = (cards?: any[]) => {
  if (!cards) return [];
  const map = new Map();
  cards.forEach(c => {
    if (map.has(c.code)) {
      map.get(c.code).count += c.qty || 1;
    } else {
      map.set(c.code, { ...c, count: c.qty || 1 });
    }
  });
  return Array.from(map.values());
};

interface DeckDetail {
  tournament: { id: string; name: string; startDate: number | null; location: string | null } | null;
  player: { name: string; placement: number | null; wins: number; losses: number; draws: number };
  leader: any;
  champion: any;
  battlefields: any[];
  runes: any[];
  mainDeck: any[];
  sideboard: any[];
  decklistText: string | null;
}

export default function MetaDeckViewPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;
  const playerName = decodeURIComponent(params.playerName as string);

  const [deck, setDeck] = useState<DeckDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [showExport, setShowExport] = useState(false);
  const [exportText, setExportText] = useState("");
  const [copied, setCopied] = useState(false);
  const [playUrl, setPlayUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!tournamentId || !playerName) return;
    setIsLoading(true);
    fetch(`/api/meta/decks/${tournamentId}/${encodeURIComponent(playerName)}`)
      .then(res => res.json())
      .then(data => {
        if (data.data) setDeck(data.data);
      })
      .finally(() => setIsLoading(false));
  }, [tournamentId, playerName]);

  const groupedMainDeck = useMemo(() => groupCards(deck?.mainDeck), [deck]);
  const groupedSideboard = useMemo(() => groupCards(deck?.sideboard), [deck]);
  const groupedRunes = useMemo(() => groupCards(deck?.runes), [deck]);

  const runeColors = useMemo(
    () => [...new Set((deck?.runes || []).map((r: any) => r.detail?.Color?.[0]).filter(Boolean))],
    [deck]
  );

  const handleExport = () => {
    setExportText(buildDecklistText());
    setShowExport(true);
  };

  // Build the Rift Atlas deck code and open the simulator with it preloaded.
  const atlasPlayUrl = useMemo(() => {
    if (!deck) return null;
    try {
      const toEntries = (cards: any[]) =>
        (cards || [])
          .filter(c => c.code)
          .map(c => ({ cardCode: c.code, count: c.qty || 1 }));
      const mainEntries = toEntries(deck.mainDeck).concat(
        deck.leader?.code ? [{ cardCode: deck.leader.code, count: 1 }] : [],
        deck.champion?.code ? [{ cardCode: deck.champion.code, count: 1 }] : []
      );
      const sideEntries = toEntries(deck.sideboard);
      const code = buildAtlasDeckCode(mainEntries, sideEntries);
      return `https://play.riftatlas.com/?deckCode=${encodeURIComponent(code)}`;
    } catch {
      return null; // e.g. R/SP card numbers not supported by our v3 encoder
    }
  }, [deck]);

  const buildDecklistText = () => {
    if (!deck) return "";
    let result = "";
    if (deck.leader) result += `Legend:\n1 ${deck.leader.name}\n\n`;
    if (deck.champion) result += `Champion:\n1 ${deck.champion.name}\n\n`;

    const addSection = (title: string, cards: any[]) => {
      if (!cards || cards.length === 0) return;
      result += `${title}:\n`;
      const counts: Record<string, number> = {};
      cards.forEach(c => {
        counts[c.name] = (counts[c.name] || 0) + (c.qty || 1);
      });
      Object.entries(counts).forEach(([name, count]) => {
        result += `${count} ${name}\n`;
      });
      result += "\n";
    };

    // Champion already shown separately; exclude from main deck list
    const mainDeckToExport = (deck.mainDeck || []).filter(
      c => !deck.champion || c.name !== deck.champion.name
    );
    addSection("MainDeck", mainDeckToExport);
    addSection("Battlefields", deck.battlefields);
    addSection("Runes", deck.runes);
    addSection("Sideboard", deck.sideboard);

    return result.trim();
  };

  if (isLoading) return <div className="p-12 text-center text-gray-500">Loading...</div>;
  if (!deck) return (
    <div className="p-12 text-center text-red-500">
      Deck not found —{" "}
      <Link href="/meta/decks" className="underline hover:text-[var(--primary)]">กลับไปหน้าเด็คยอดนิยม</Link>
    </div>
  );

  const mainDeckCount = (deck.mainDeck || []).reduce((acc, c) => acc + (c.qty || 1), 0);

  return (
    <div className="flex-1 overflow-auto bg-[#111]">
      {/* Header */}
      <div className="relative p-8 sm:p-12 border-b border-[#333]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {deck.leader?.imageUrl && (
            <>
              <img src={deck.leader.imageUrl} className="w-full h-full object-cover opacity-20 blur-xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent"></div>
            </>
          )}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <Link href="/meta/decks" className="hover:text-[var(--primary)]">← เด็คยอดนิยม</Link>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">{deck.leader?.name || deck.player.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">By</span>
                  <span className="font-medium text-white">{deck.player.name}</span>
                </div>
                {deck.player.placement !== null && (
                  <div className="bg-[#1a3a22] border border-[#2d5a36] text-[#4ade80] px-2 py-1 rounded">
                    Placement #{deck.player.placement} · {deck.player.wins}W-{deck.player.losses}L
                    {deck.player.draws > 0 ? `-${deck.player.draws}D` : ""}
                  </div>
                )}
                {deck.tournament && (
                  <div className="text-gray-400">
                    🏟 {deck.tournament.name}
                    {deck.tournament.startDate ? ` · ${new Date(deck.tournament.startDate * 1000).toLocaleDateString()}` : ""}
                  </div>
                )}
                <div className="flex gap-2">
                  {runeColors.map((color: any) => (
                    <div key={color} className="flex items-center gap-1 bg-[#222] border border-[#444] px-2 py-1 rounded">
                      <img src={`/runes/${color}.webp`} alt={color} className="w-4 h-4" />
                      <span className="text-gray-300">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex gap-2">
                {atlasPlayUrl && (
                  <a
                    href={atlasPlayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#1d3a5f] hover:bg-[#2a5285] text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
                    title="เปิดเด็คนี้ใน Rift Atlas Simulator"
                  >
                    ▶ Play on Rift Atlas
                  </a>
                )}
                <button
                  onClick={() => router.push(`/decks/builder?import=${encodeURIComponent(buildDecklistText())}`)}
                  className="bg-[#2d5a36] hover:bg-[#3a7a48] text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  Import to Builder
                </button>
                <button
                  onClick={handleExport}
                  className="bg-[#a58d4a] hover:bg-[#8b763c] text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Deck List */}
        <div className="lg:col-span-2 space-y-8 overflow-hidden">

          {/* Row 1: Legend, Champion, Runes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div>
              <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Legend</h2>
              {deck.leader && (
                <div onClick={() => setSelectedCard(deck.leader)} className="relative rounded-xl overflow-hidden shadow-lg border border-[#333] hover:border-[#a58d4a] transition-colors cursor-pointer w-full">
                  <img src={deck.leader.imageUrl} alt={deck.leader.name} className="w-full h-auto" />
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Champion</h2>
              {deck.champion && (
                <div onClick={() => setSelectedCard(deck.champion)} className="relative rounded-xl overflow-hidden shadow-lg border border-[#333] hover:border-[#a58d4a] transition-colors cursor-pointer w-full">
                  <img src={deck.champion.imageUrl} alt={deck.champion.name} className="w-full h-auto" />
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Runes <span className="text-[#a58d4a] ml-1">{deck.runes?.length || 0}/12</span></h2>
              <div className="grid grid-cols-2 gap-2">
                {groupedRunes.map((rune: any) => (
                  <div key={rune.code} onClick={() => setSelectedCard(rune)} className="relative rounded-xl overflow-hidden shadow-lg border border-[#333] hover:border-[#a58d4a] transition-colors cursor-pointer">
                    <img src={rune.imageUrl} alt={rune.name} className="w-full h-auto" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 text-white font-bold text-center py-1 border-t border-[#333]">
                      x{rune.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Battlefields */}
          <div className="pt-4">
            <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Battlefields <span className="text-[#a58d4a] ml-1">{deck.battlefields?.length || 0}/3</span></h2>
            <div className="grid grid-cols-3 gap-4">
              {(deck.battlefields || []).map((bf: any, idx: number) => (
                <div key={bf.id + idx} onClick={() => setSelectedCard(bf)} className="relative rounded-xl overflow-hidden shadow-lg border border-[#333] hover:border-[#a58d4a] transition-colors cursor-pointer bg-[#111]" style={{ aspectRatio: "1.42 / 1" }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img src={bf.imageUrl} alt={bf.name} className="rotate-90 pointer-events-none" style={{ height: "142%", maxWidth: "none", objectFit: "contain" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Deck */}
          <div className="pt-12">
            <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Main Deck <span className="text-[#a58d4a] ml-1">{mainDeckCount}</span></h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {groupedMainDeck.map((card: any) => (
                <div key={card.code} onClick={() => setSelectedCard(card)} className="relative rounded-xl overflow-hidden shadow-lg border border-[#333] hover:border-[#a58d4a] transition-colors cursor-pointer group">
                  <img src={card.imageUrl} alt={card.name} className="w-full h-auto" />
                  <div className="absolute top-1 left-1 bg-black/80 border border-[#444] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full z-10 group-hover:bg-[#a58d4a] group-hover:border-transparent transition-colors">
                    {card.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sideboard */}
          {groupedSideboard.length > 0 && (
            <div className="pt-4">
              <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Sideboard <span className="text-[#a58d4a] ml-1">{(deck.sideboard || []).reduce((acc, c) => acc + (c.qty || 1), 0)}/10</span></h2>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {groupedSideboard.map((card: any) => (
                  <div key={card.code} onClick={() => setSelectedCard(card)} className="relative rounded-xl overflow-hidden shadow-lg border border-[#333] hover:border-[#a58d4a] transition-colors cursor-pointer group">
                    <img src={card.imageUrl} alt={card.name} className="w-full h-auto" />
                    <div className="absolute top-1 left-1 bg-black/80 border border-[#444] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full z-10 group-hover:bg-[#a58d4a] group-hover:border-transparent transition-colors">
                      {card.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Stats */}
        <div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 sticky top-6">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-[#333] pb-4">Stats</h3>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="text-center p-4 bg-[#111] rounded-lg border border-[#222]">
                <div className="text-3xl font-bold text-white mb-1">{mainDeckCount}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Cards</div>
              </div>
              <div className="text-center p-4 bg-[#111] rounded-lg border border-[#222]">
                <div className="text-3xl font-bold text-white mb-1">
                  {(
                    (deck.mainDeck || []).filter((c: any) => c.detail?.Energy).reduce((acc: number, c: any) => acc + parseInt(c.detail.Energy || 0), 0) /
                    Math.max((deck.mainDeck || []).filter((c: any) => c.detail?.Energy).length, 1)
                  ).toFixed(1)}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Avg Energy</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Main Deck Types</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(
                    (deck.mainDeck || []).reduce((acc: Record<string, number>, c: any) => {
                      acc[c.type] = (acc[c.type] || 0) + (c.qty || 1);
                      return acc;
                    }, {})
                  ).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">{type}</span>
                      <span className="text-white font-medium bg-[#333] px-2 py-0.5 rounded">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {deck.tournament && (
              <div className="mt-6 pt-6 border-t border-[#333] text-xs text-gray-500">
                ข้อมูลจากทัวร์นาเมนต์จริง ·{" "}
                <a href="https://topdeck.gg" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">
                  Data provided by TopDeck.gg
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedCard && <CardModal selectedCard={selectedCard} onClose={() => setSelectedCard(null)} />}

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setShowExport(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2 text-white">Export Deck</h2>
            <p className="text-sm text-gray-400 mb-4">คัดลอก decklist เพื่อนำไปแชร์หรือ import ใน Deck Builder</p>
            <textarea
              readOnly
              value={exportText}
              rows={12}
              className="w-full bg-[#111] border border-[var(--border)] rounded-lg p-3 text-sm text-gray-300 font-mono outline-none focus:border-[var(--primary)]"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowExport(false)}
                className="px-4 py-2 bg-[#222] hover:bg-[#333] text-white rounded-lg transition-colors border border-[var(--border)]"
              >
                Close
              </button>
              {atlasPlayUrl && (
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(atlasPlayUrl.replace("https://play.riftatlas.com/?deckCode=", ""));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="px-4 py-2 bg-[#1d3a5f] hover:bg-[#2a5285] text-white rounded-lg transition-colors"
                  title="คัดลอก deck code เพื่อวางใน Rift Atlas"
                >
                  {copied ? "✓ Copied" : "Copy Deck Code"}
                </button>
              )}
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(exportText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

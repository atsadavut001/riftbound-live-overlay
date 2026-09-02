"use client";
import CardModal from "@/components/CardModal";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// Utility to group identical cards
const groupCards = (cards: any[]) => {
  if (!cards) return [];
  const map = new Map();
  cards.forEach(c => {
    if (map.has(c.code)) {
      map.get(c.code).count++;
    } else {
      map.set(c.code, { ...c, count: 1 });
    }
  });
  return Array.from(map.values());
};

export default function DeckViewPage() {
  const router = useRouter();
  const params = useParams();
  const [deck, setDeck] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<any>(null);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/decks/${params.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setDeck(data.data);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [params.id]);

  if (isLoading) return <div className="p-12 text-center text-gray-500">Loading...</div>;
  if (!deck) return <div className="p-12 text-center text-red-500">Deck not found</div>;

  const { legend, champion, mainDeck, battlefields, runes, sideboard } = deck.cards || {};
  
  const groupedMainDeck = groupCards(mainDeck);
  const groupedSideboard = groupCards(sideboard);
  const groupedRunes = groupCards(runes);

  // Combine unique colors from runes
  const runeColors = [...new Set((runes || []).map((r: any) => r.detail?.Color?.[0]).filter(Boolean))];

  return (
    <div className="flex-1 overflow-auto bg-[#111]">
      {/* Header */}
      <div className="relative p-8 sm:p-12 border-b border-[#333]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {deck.coverImageUrl && (
            <>
              <img src={deck.coverImageUrl} className="w-full h-full object-cover opacity-20 blur-xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent"></div>
            </>
          )}
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-bold text-white mb-4">{deck.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">By</span>
                  <span className="font-medium text-white">{deck.userId === 'anonymous' ? 'You' : deck.userId}</span>
                </div>
                
                <div className="flex gap-2">
                  {runeColors.map((color: any) => (
                    <div key={color} className="flex items-center gap-1 bg-[#222] border border-[#444] px-2 py-1 rounded">
                      <img src={`/runes/${color}.webp`} alt={color} className="w-4 h-4" />
                      <span className="text-gray-300">{color}</span>
                    </div>
                  ))}
                </div>
                
                <div className="bg-[#1a3a22] border border-[#2d5a36] text-[#4ade80] px-2 py-1 rounded">
                  {deck.visibility}
                </div>
                
                <div className="text-gray-400">
                  Updated {new Date(deck.updatedAt || deck.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              
              {deck.userId === 'anonymous' && (
                <button 
                  onClick={() => router.push(`/decks/builder?id=${deck.id}`)}
                  className="bg-[#1a3a22] hover:bg-[#2d5a36] text-[#4ade80] px-4 py-2 rounded font-medium transition-colors border border-[#2d5a36]"
                >
                  Edit Deck
                </button>
              )}
              {deck.userId === 'anonymous' && (
                <button 
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this deck?')) {
                       try {
                          const res = await fetch(`/api/decks/${deck.id}`, { method: 'DELETE' });
                          if (res.ok) {
                            router.push('/decks/my-decks');
                          } else {
                            alert('Failed to delete deck');
                          }
                       } catch (err) {
                          console.error(err);
                       }
                    }
                  }}
                  className="bg-[#3a1a1a] hover:bg-[#5a2d2d] text-[#ff5e5b] px-4 py-2 rounded font-medium transition-colors border border-[#5a2d2d]"
                >
                  Delete
                </button>
              )}
              <button className="bg-[#a58d4a] hover:bg-[#8b763c] text-white px-4 py-2 rounded font-medium transition-colors">
                Export
              </button>
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
              {legend && (
                <div onClick={() => setSelectedCard(legend)} className="relative rounded-xl overflow-hidden shadow-lg border border-[#333] hover:border-[#a58d4a] transition-colors cursor-pointer w-full">
                  <img src={legend.imageUrl} alt={legend.name} className="w-full h-auto" />
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Champion</h2>
              {champion && (
                <div onClick={() => setSelectedCard(champion)} className="relative rounded-xl overflow-hidden shadow-lg border border-[#333] hover:border-[#a58d4a] transition-colors cursor-pointer w-full">
                  <img src={champion.imageUrl} alt={champion.name} className="w-full h-auto" />
                </div>
              )}
            </div>
            
            <div>
              <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Runes <span className="text-[#a58d4a] ml-1">{runes?.length || 0}/12</span></h2>
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
            <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Battlefields <span className="text-[#a58d4a] ml-1">{battlefields?.length || 0}/3</span></h2>
            <div className="grid grid-cols-3 gap-4">
              {(battlefields || []).map((bf: any, idx: number) => (
                <div key={bf.id + idx} onClick={() => setSelectedCard(bf)} className="relative rounded-xl overflow-hidden shadow-lg border border-[#333] hover:border-[#a58d4a] transition-colors cursor-pointer bg-[#111]" style={{ aspectRatio: '1.42 / 1' }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img src={bf.imageUrl} alt={bf.name} className="rotate-90 pointer-events-none" style={{ height: '142%', maxWidth: 'none', objectFit: 'contain' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Main Deck (8 per row) */}
          <div className="pt-12">
            <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Main Deck <span className="text-[#a58d4a] ml-1">{(mainDeck || []).length}</span></h2>
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
          
          {/* Sideboard (8 per row) */}
          {groupedSideboard.length > 0 && (
            <div className="pt-4">
              <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Sideboard <span className="text-[#a58d4a] ml-1">{(sideboard || []).length}/10</span></h2>
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
                <div className="text-3xl font-bold text-white mb-1">{(mainDeck || []).length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Cards</div>
              </div>
              <div className="text-center p-4 bg-[#111] rounded-lg border border-[#222]">
                <div className="text-3xl font-bold text-white mb-1">
                  {((mainDeck || []).filter((c:any)=>c.detail?.Energy).reduce((acc:any, c:any)=>acc+parseInt(c.detail.Energy||0), 0) / Math.max((mainDeck||[]).filter((c:any)=>c.detail?.Energy).length, 1)).toFixed(1)}
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
                    (mainDeck || []).reduce((acc:any, c:any) => {
                      acc[c.type] = (acc[c.type] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([type, count]: any) => (
                    <div key={type} className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">{type}</span>
                      <span className="text-white font-medium bg-[#333] px-2 py-0.5 rounded">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      {selectedCard && <CardModal selectedCard={selectedCard} onClose={() => setSelectedCard(null)} />}
    </div>
  );
}

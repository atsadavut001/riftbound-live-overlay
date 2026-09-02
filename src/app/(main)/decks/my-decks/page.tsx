"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DecksPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRunes, setSelectedRunes] = useState<string[]>([]);
  const [decks, setDecks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/decks?user=me')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setDecks(data.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const toggleRune = (rune: string) => {
    setSelectedRunes(prev => 
      prev.includes(rune) ? prev.filter(r => r !== rune) : [...prev, rune]
    );
  };
  
  const filteredDecks = decks.filter(deck => {
    if (searchTerm && !deck.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    // We could filter by runes here if we extract runes from deck.cards.runes
    return true;
  });

  return (
    <div className="flex-1 flex flex-col p-8 sm:p-12 max-w-6xl mx-auto w-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Decks</h1>
          <p className="text-gray-400 text-sm">View and manage your personal deck collection.</p>
        </div>
        <Link href="/decks/builder" className="bg-[#a58d4a] hover:bg-[#8b763c] text-white px-4 py-2 rounded-md transition-colors text-sm font-medium">
          + New Deck
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search decks by name..." 
              className="w-full bg-[#111] border border-[#333] rounded-md pl-10 pr-4 py-2 text-sm outline-none focus:border-[#a58d4a] transition-colors"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12 text-gray-500">Loading decks...</div>
      ) : filteredDecks.length === 0 ? (
        <div className="flex justify-center p-12 text-gray-500 bg-[#1a1a1a] border border-[#333] rounded-xl">No decks found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDecks.map(deck => {
            const runes = deck.cards?.runes || [];
            // Get unique rune colors
            const runeColors = [...new Set(runes.map((r: any) => r.detail?.Color?.[0]).filter(Boolean))];
            
            return (
              <Link href={`/decks/${deck.id}`} key={deck.id} className="bg-[#1a1a1a] border border-[#333] rounded-xl flex overflow-hidden hover:border-[#555] transition-colors cursor-pointer group">
                <div className="w-[100px] sm:w-[130px] shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1a1a1a] z-10 pointer-events-none"></div>
                  <img src={deck.coverImageUrl || '/placeholder.jpg'} alt={deck.name} className="w-full h-full object-cover object-left-top transform group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 200 300"><rect width="200" height="300" fill="%23222"/></svg>' }} />
                </div>
                
                <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="font-bold text-sm sm:text-base text-white truncate" title={deck.name}>{deck.name}</h3>
                      <div className="text-xs bg-[#333] px-2 py-0.5 rounded text-gray-300 shrink-0">{deck.visibility}</div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3 flex-wrap">
                      <span className="truncate max-w-[120px]">by {deck.userId === "anonymous" ? "You" : deck.userId}</span>
                      <span>·</span>
                      <span>{new Date(deck.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {/* Runes */}
                      {runeColors.map(c => (
                        <img key={c as string} src={`/runes/${c}.webp`} alt={c as string} className="w-5 h-5 object-contain" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                      ))}
                      
                      <div className="h-4 w-px bg-[#333] mx-1"></div>
                      
                      {/* Card Count */}
                      <span className="text-xs text-gray-400">{deck.cards?.mainDeck?.length || 0} Cards</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2 relative z-20">
                    <span className="text-[#a58d4a] font-medium text-sm"></span>
                    <button 
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this deck?')) {
                           try {
                              const res = await fetch(`/api/decks/${deck.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                setDecks(prev => prev.filter(d => d.id !== deck.id));
                              } else {
                                alert('Failed to delete deck');
                              }
                           } catch (err) {
                              console.error(err);
                           }
                        }
                      }}
                      className="text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded text-xs transition-colors font-medium z-20 relative"
                    >
                      Delete
                    </button>
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

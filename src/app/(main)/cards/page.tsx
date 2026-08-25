"use client";

import { useState, useEffect, useRef } from "react";

// Outside component: Custom MultiSelect
const MultiSelect = ({ label, options, selected, onChange }: { label: string, options: {label: string, value: string}[], selected: string[], onChange: (v: string[]) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative flex-1 min-w-[120px]" ref={ref}>
      <div 
        className="flex items-center gap-2 bg-[#111] border border-[#333] rounded-md px-3 py-1.5 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <span className="text-xs text-gray-500">{label}</span>
        <div className="text-sm text-gray-300 flex-1 truncate">
          {selected.length === 0 ? "All" : selected.map(v => options.find(o => o.value === v)?.label || v).join(", ")}
        </div>
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-[#1a1a1a] border border-[#333] rounded-md z-50 py-1 shadow-xl max-h-60 overflow-y-auto">
          {options.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#222] cursor-pointer">
              <input 
                type="checkbox" 
                checked={selected.includes(opt.value)}
                onChange={(e) => {
                  if (e.target.checked) onChange([...selected, opt.value]);
                  else onChange(selected.filter(v => v !== opt.value));
                }}
                className="accent-[var(--primary)]"
              />
              <span className="text-sm text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default function CardLibraryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSet, setSelectedSet] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  
  const cardsPerPage = 48;
  const totalPages = Math.max(1, Math.ceil(totalCards / cardsPerPage));

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (selectedCard) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [selectedCard]);

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      try {
        const setQuery = selectedSet.length > 0 ? selectedSet.join(",") : "";
        const typeQuery = selectedType.length > 0 ? selectedType.join(",") : "";
        const rarityQuery = selectedRarity.length > 0 ? selectedRarity.join(",") : "";
        const colorQuery = selectedColor.length > 0 ? selectedColor.join(",") : "";
        
        const res = await fetch(`/api/admin/cards?page=${currentPage}&limit=${cardsPerPage}&set=${setQuery}&type=${typeQuery}&rarity=${rarityQuery}&color=${colorQuery}&search=${encodeURIComponent(debouncedSearchTerm)}`);
        if (res.ok) {
          const data = await res.json();
          setCards(data.data);
          setTotalCards(data.total);
        }
      } catch (err) {
        console.error("Failed to fetch cards", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [currentPage, selectedSet, selectedType, selectedRarity, selectedColor, debouncedSearchTerm]);

  const renderAbilityText = (text: string) => {
    if (!text) return null;
    const keywords_1FA289 = ["ACCELERATE", "HIDDEN", "LEGION", "ACTION", "REACTION", "AMBUSH"];
    const keywords_CC2C6B = ["ASSAULT", "SHIELD", "TANK"];
    const keywords_99B330 = ["DEFLECT", "DEATHKNELL", "GANKING", "TEMPORARY", "HUNT", "LEVEL", "EMPOWERED"];
    const keywords_6B6F70 = ["VISION", "EQUIP", "EQULP", "PREDICT", "BURN", "EMPOWER", "ADD", "WEAPONMASTER", "STUN"];
    const regex = /(\[[^\]]+\])/g;
    const parts = (text || "").split(regex);
    
    return (
      <>
        {parts.map((part, i) => {
          if (part.startsWith("[") && part.endsWith("]")) {
            const inner = part.slice(1, -1);
            
            // Check for numbers or 'X'
            const isNumber = /^\d+$/.test(inner) || inner.toUpperCase() === "X";
            if (isNumber) {
              return (
                <span key={i} className="inline-flex items-center justify-center w-[18px] h-[18px] mx-0.5 rounded-full bg-gray-200 text-black text-[11px] font-bold align-middle shadow-sm leading-none">
                  {inner}
                </span>
              );
            }
            
            // Check for runes
            const runes = ["Body", "Calm", "Chaos", "Fury", "Mind", "Order", "Rainbow"];
            const matchedRune = runes.find(r => r.toLowerCase() === inner.toLowerCase());
            if (matchedRune) {
              return (
                <img 
                  key={i} 
                  src={`/runes/${matchedRune}.webp`} 
                  alt={matchedRune} 
                  className="inline-block w-[18px] h-[18px] mx-0.5 align-middle select-none" 
                />
              );
            }

            let bgColor = "#444";
            if (keywords_1FA289.some(kw => inner.toUpperCase().startsWith(kw))) {
              bgColor = "#1FA289";
            } else if (keywords_CC2C6B.some(kw => inner.toUpperCase().startsWith(kw))) {
              bgColor = "#CC2C6B";
            } else if (keywords_99B330.some(kw => inner.toUpperCase().startsWith(kw))) {
              bgColor = "#99B330";
            } else if (keywords_6B6F70.some(kw => inner.toUpperCase().startsWith(kw))) {
              bgColor = "#6B6F70";
            }
            return (
              <span key={i} className="px-1.5 py-0.5 mx-0.5 rounded text-[10px] font-bold text-white tracking-wider align-middle shadow-sm" style={{ backgroundColor: bgColor }}>
                {inner}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex-1 flex flex-col p-8 sm:p-12 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Card Library</h1>
        <p className="text-gray-400">Browse and discover all Riftbound cards</p>
      </div>

      {/* Filters Area */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 sm:p-6 mb-8">
        
        {/* Top Row: Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by card name or code..." 
              className="w-full bg-[#111] border border-[#333] rounded-md pl-4 pr-10 py-2 text-sm outline-none focus:border-[var(--primary)] text-white"
            />
          </div>

        </div>

        {/* Middle Row: Filters */}
        <div className="flex flex-wrap items-center gap-6 mb-6">
          {/* Factions */}
          <div className="flex gap-2">
            {['Fury', 'Calm', 'Mind', 'Order', 'Chaos', 'Body'].map((rune) => (
              <button 
                key={rune} 
                onClick={() => { 
                  setSelectedColor(prev => prev.includes(rune) ? prev.filter(r => r !== rune) : [...prev, rune]); 
                  setCurrentPage(1); 
                }}
                className={`w-9 h-9 rounded-full border flex items-center justify-center hover:opacity-80 transition-all ${selectedColor.includes(rune) ? 'border-[var(--primary)] bg-[#222]' : 'border-[#444] bg-transparent'}`} 
                title={rune}
              >
                <img src={`/runes/${rune}.webp`} alt={rune} className="w-6 h-6 object-contain" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
              </button>
            ))}
          </div>

          {/* Selects */}
          <div className="flex flex-wrap gap-4 flex-1">
            <MultiSelect 
              label="Set" 
              options={[
                {label: "Origins [OGN]", value: "OGN"},
                {label: "Spiritforged [SFD]", value: "SFD"},
                {label: "Unleashed [UNL]", value: "UNL"},
                {label: "Vendetta [VEN]", value: "VEN"},
                {label: "Proving Grounds [OGS]", value: "OGS"},
                {label: "Arcane Box Set [ARC]", value: "ARC"}
              ]} 
              selected={selectedSet} 
              onChange={(v) => { setSelectedSet(v); setCurrentPage(1); }} 
            />
            <MultiSelect 
              label="Type" 
              options={[
                {label: "Legend", value: "Legend"},
                {label: "Battlefield", value: "Battlefield"},
                {label: "Unit", value: "Unit"},
                {label: "Gear", value: "Gear"},
                {label: "Spell", value: "Spell"},
                {label: "Rune", value: "Rune"}
              ]} 
              selected={selectedType} 
              onChange={(v) => { setSelectedType(v); setCurrentPage(1); }} 
            />
            <MultiSelect 
              label="Rarity" 
              options={[
                {label: "Common", value: "Common"},
                {label: "Uncommon", value: "Uncommon"},
                {label: "Rare", value: "Rare"},
                {label: "Epic", value: "Epic"},
                {label: "Showcase", value: "Showcase"}
              ]} 
              selected={selectedRarity} 
              onChange={(v) => { setSelectedRarity(v); setCurrentPage(1); }} 
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="flex justify-between items-center text-sm pt-4 border-t border-[#333]">
          <div className="text-gray-400">Active: <span className="text-gray-500">None</span></div>
          <div className="font-medium"><span className="text-[var(--primary)] font-bold">{totalCards.toLocaleString()}</span> cards</div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-400">
          Showing <span className="text-white font-medium">{cardsPerPage}</span> of <span className="text-[var(--primary)] font-bold">{totalCards.toLocaleString()}</span> cards
        </div>
        <div className="text-sm text-gray-400 flex items-center gap-2">
          Page {currentPage} of {totalPages}
          <button className="text-gray-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Loading cards...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {cards.map((card, index) => (
            <div 
              key={index} 
              onClick={() => setSelectedCard(card)}
              className="aspect-[2/3] relative rounded-lg overflow-hidden border border-[#333] hover:border-[var(--primary)] transition-colors cursor-pointer group bg-[#111]"
            >
              <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-600 z-0">
                {card.code}
              </div>
              {card.imageUrl && (
                <img 
                  src={card.imageUrl} 
                  alt={card.code}
                  className="absolute inset-0 w-full h-full object-cover z-10 group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4 border-t border-[#333]">
        <div></div>
        <div className="flex items-center gap-1 text-sm">
          <button 
            className="px-2 py-1 text-gray-400 hover:text-white disabled:opacity-50"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >&laquo;</button>
          <button 
            className="px-3 py-1 text-gray-400 hover:text-white disabled:opacity-50"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >&lt; Previous</button>
          
          {getPageNumbers().map((p, idx) => (
            p === '...' ? (
              <span key={`dots-${idx}`} className="text-gray-500 px-2">...</span>
            ) : (
              <button 
                key={p} 
                onClick={() => setCurrentPage(p as number)}
                className={`w-8 h-8 flex items-center justify-center rounded-md ${currentPage === p ? 'bg-[var(--primary)] text-white font-bold' : 'text-gray-400 hover:bg-[#222]'}`}
              >
                {p}
              </button>
            )
          ))}

          <button 
            className="px-3 py-1 text-gray-400 hover:text-white disabled:opacity-50"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >Next &gt;</button>
          <button 
            className="px-2 py-1 text-gray-400 hover:text-white disabled:opacity-50"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          >&raquo;</button>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-400">
          Go to 
          <input 
            type="text" 
            className="w-12 bg-[#111] border border-[#333] rounded px-2 py-1 text-center outline-none focus:border-gray-500 text-white" 
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = parseInt((e.target as HTMLInputElement).value);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  setCurrentPage(val);
                }
              }
            }}
          />
          / {totalPages}
        </div>
      </div>

      {/* Modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedCard(null)}>
          <div 
            className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-2"
              onClick={() => setSelectedCard(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            {/* Left: Card Image */}
            <div className="w-full md:w-[45%] lg:w-[40%] bg-black p-6 flex items-center justify-center border-r border-[#333]">
              <div className={`relative w-full max-w-sm flex items-center justify-center overflow-hidden ${selectedCard.type === 'Battlefield' ? 'aspect-[3/2]' : 'aspect-[2/3]'}`}>
                <img 
                  src={selectedCard.imageUrl} 
                  alt={selectedCard.code}
                  style={selectedCard.type === 'Battlefield' ? { transform: 'rotate(90deg)', height: '150%', width: 'auto', maxWidth: 'none' } : {}}
                  className={`rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] ${selectedCard.type === 'Battlefield' ? '' : 'w-full h-full object-contain'}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 200 300"><rect width="200" height="300" fill="%23222"/><text x="100" y="150" fill="%23666" text-anchor="middle" dominant-baseline="middle">Card Missing</text></svg>';
                  }}
                />
              </div>
            </div>

            {/* Right: Card Details */}
            <div className="w-full md:w-[55%] lg:w-[60%] p-8 overflow-y-auto max-h-[80vh]">
              <h2 className="text-3xl font-bold mb-4">{selectedCard.name}, {selectedCard.code}</h2>
              
              {/* Badges Row 1 */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] border border-[#333] rounded-md text-sm font-medium">
                  {selectedCard.rarity && (
                    <img 
                      src={`/rarity/${selectedCard.rarity.toLowerCase()}.webp`} 
                      alt={selectedCard.rarity} 
                      className="w-5 h-5 object-contain"
                      onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                    />
                  )}
                  {selectedCard.type}
                </div>
                {selectedCard.detail?.Color?.map((c: string, i: number) => (
                  <div key={`c-${i}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] border border-[#333] rounded-md text-sm font-medium">
                    <img 
                      src={`/runes/${c}.webp`} 
                      alt={c} 
                      className="w-5 h-5 object-contain"
                      onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                    />
                    {c}
                  </div>
                ))}
                {selectedCard.detail?.Tag?.map((tag: string, i: number) => (
                  <div key={`t-${i}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] border border-[#333] rounded-md text-sm font-medium">
                    {tag}
                  </div>
                ))}
              </div>

              {/* Stats Box */}
              {(selectedCard.detail?.Energy || selectedCard.detail?.Power || selectedCard.detail?.Might) && (
                <div className="grid grid-cols-3 bg-[#1a1a1a] border border-[#333] rounded-xl p-4 mb-8">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-gray-400 text-sm mb-1">Energy</span>
                    <span className="text-4xl font-bold">{selectedCard.detail?.Energy || '-'}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center border-x border-[#333]">
                    <span className="text-gray-400 text-sm mb-1">Power</span>
                    <span className="text-4xl font-bold">{selectedCard.detail?.Power || '-'}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-gray-400 text-sm mb-1">Might</span>
                    <span className="text-4xl font-bold">{selectedCard.detail?.Might || '-'}</span>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedCard.detail?.Ability && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-2">Ability</h3>
                  <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {renderAbilityText(selectedCard.detail?.Ability)}
                  </div>
                </div>
              )}

              {selectedCard.detail?.["Flavor Text"] && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-2">Flavor Text</h3>
                  <p className="text-gray-500 italic leading-relaxed whitespace-pre-wrap">
                    {selectedCard.detail?.["Flavor Text"]}
                  </p>
                </div>
              )}

              {/* Equip Effect */}
              {selectedCard.detail?.["Equip Effect"] && (
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
                    <div className="w-full sm:w-4/5 p-4 sm:p-6 border-b sm:border-b-0 sm:border-r border-[#333]">
                      <h3 className="text-lg font-bold mb-2">Equip Effect</h3>
                      <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {renderAbilityText(selectedCard.detail?.["Equip Effect"])}
                      </div>
                    </div>
                    <div className="w-full sm:w-1/5 flex flex-col items-center justify-center p-4 bg-[#111]">
                      <span className="text-gray-400 text-sm mb-1 text-center">Might</span>
                      <span className="text-4xl font-bold">{selectedCard.detail?.["Equip Might"] || '-'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

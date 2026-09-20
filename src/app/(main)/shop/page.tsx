"use client";

import { useState, useEffect, useRef } from "react";

// Custom MultiSelect
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

export default function ShopPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [cards, setCards] = useState<any[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSet, setSelectedSet] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  
  const cardsPerPage = 48;
  const totalPages = Math.max(1, Math.ceil(totalCards / cardsPerPage));

  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [selectedItem]);

  const addToCart = async (shopItem: any) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopItemId: shopItem.id, quantity: 1 })
      });
      if (res.ok) {
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        const data = await res.json();
        if (data.error === "Unauthorized") {
          alert("กรุณาล็อกอินก่อนเพิ่มลงตะกร้า");
        } else {
          alert("ไม่สามารถเพิ่มลงตะกร้าได้: " + data.error);
        }
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }
  };

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
            const isNumber = /^\d+$/.test(inner) || inner.toUpperCase() === "X";
            if (isNumber) {
              return (
                <span key={i} className="inline-flex items-center justify-center w-[18px] h-[18px] mx-0.5 rounded-full bg-gray-200 text-black text-[11px] font-bold align-middle shadow-sm leading-none">
                  {inner}
                </span>
              );
            }
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
            if (keywords_1FA289.some(kw => inner.toUpperCase().startsWith(kw))) bgColor = "#1FA289";
            else if (keywords_CC2C6B.some(kw => inner.toUpperCase().startsWith(kw))) bgColor = "#CC2C6B";
            else if (keywords_99B330.some(kw => inner.toUpperCase().startsWith(kw))) bgColor = "#99B330";
            else if (keywords_6B6F70.some(kw => inner.toUpperCase().startsWith(kw))) bgColor = "#6B6F70";
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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const fetchShopItems = async () => {
      setLoading(true);
      try {
        const setQuery = selectedSet.length > 0 ? selectedSet.join(",") : "";
        const typeQuery = selectedType.length > 0 ? selectedType.join(",") : "";
        const rarityQuery = selectedRarity.length > 0 ? selectedRarity.join(",") : "";
        const colorQuery = selectedColor.length > 0 ? selectedColor.join(",") : "";
        
        const res = await fetch(`/api/shop?page=${currentPage}&limit=${cardsPerPage}&set=${setQuery}&type=${typeQuery}&rarity=${rarityQuery}&color=${colorQuery}&search=${encodeURIComponent(debouncedSearchTerm)}`);
        if (res.ok) {
          const data = await res.json();
          setCards(data.data); // these are now shopItems
          setTotalCards(data.total);
        }
      } catch (err) {
        console.error("Failed to fetch shop items", err);
      } finally {
        setLoading(false);
      }
    };
    fetchShopItems();
  }, [currentPage, selectedSet, selectedType, selectedRarity, selectedColor, debouncedSearchTerm]);

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
    <div className="flex-1 flex flex-col p-8 sm:p-12 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Riftbound Zberus Shop</h1>
        <p className="text-gray-400">Find and purchase your favorite cards</p>
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

        <div className="flex justify-between items-center text-sm pt-4 border-t border-[#333]">
          <div className="text-gray-400">Active: <span className="text-gray-500">None</span></div>
          <div className="font-medium"><span className="text-[var(--primary)] font-bold">{totalCards.toLocaleString()}</span> items</div>
        </div>
      </div>

      {/* Results Header (like screenshot) */}
      <h2 className="text-xl font-bold mb-4 text-white">สินค้าทั่วไป: <span className="text-[var(--primary)]">{totalCards.toLocaleString()}</span> รายการ</h2>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Loading shop items...</div>
      ) : (
        <div className="mb-8">
          {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-[#1a1a1a] border border-[#333] rounded-xl text-gray-500">
              <div className="text-4xl mb-3">🛒</div>
              <p>ยังไม่มีสินค้าในร้านค้าขณะนี้ หรือไม่พบสินค้าที่ค้นหา</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((item, index) => {
                const card = item.card;
                if (!card) return null;
                return (
                  <div key={index} className="bg-[#1a1a1a] rounded-xl border border-[#333] p-3 flex gap-4 h-full shadow-sm hover:border-[var(--primary)] transition-colors group">
                    {/* Left: Image */}
                    <div 
                      className="relative w-[110px] aspect-[2/3] rounded-md overflow-hidden bg-black flex-shrink-0 cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      {card.imageUrl ? (
                        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No img</div>
                      )}
                    </div>
                    
                    {/* Right: Details */}
                    <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                      <div className="w-full">
                        <h3 
                          className="font-bold text-white text-sm border-b-[2.5px] border-[var(--primary)] inline-block pb-0.5 mb-1 max-w-full truncate align-bottom cursor-pointer hover:text-[var(--primary)] transition-colors"
                          onClick={() => setSelectedItem(item)}
                        >
                          {card.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-[11px] text-gray-400 font-medium">{card.code} {card.rarity || 'C'}</div>
                          {item.print && item.print !== 'Normal' && (
                            <span className="bg-purple-900/40 text-purple-400 text-[9px] px-1.5 py-0 rounded font-bold border border-purple-800/50 flex-shrink-0">
                              {item.print}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex border border-[#333] rounded-lg overflow-hidden mt-3 h-[42px]">
                        <div className="flex-1 px-1 py-1 text-center border-r border-[#333] bg-[#111]">
                          <div className="text-[9px] text-gray-500">คงเหลือ</div>
                          <div className="font-bold text-white text-xs leading-none mt-1">{item.quantity}</div>
                        </div>
                        <div className="flex-1 px-1 py-1 text-center border-r border-[#333] bg-[#111]">
                          <div className="text-[9px] text-gray-500">เริ่มต้น</div>
                          <div className="font-bold text-[var(--primary)] text-xs leading-none mt-1">฿{item.price}</div>
                        </div>
                        <div 
                          className="w-10 flex items-center justify-center bg-[#222] cursor-pointer hover:bg-[var(--primary)] transition-colors group/btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(item);
                          }}
                        >
                          <svg className="w-4 h-4 text-gray-300 group-hover/btn:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
          <div 
            className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-2"
              onClick={() => setSelectedItem(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            {/* Left: Card Image */}
            <div className="w-full md:w-[45%] lg:w-[40%] bg-black p-6 flex items-center justify-center border-r border-[#333]">
              <div className={`relative w-full max-w-sm flex items-center justify-center overflow-hidden ${selectedItem.card.type === 'Battlefield' ? 'aspect-[3/2]' : 'aspect-[2/3]'}`}>
                <img 
                  src={selectedItem.card.imageUrl} 
                  alt={selectedItem.card.code}
                  style={selectedItem.card.type === 'Battlefield' ? { transform: 'rotate(90deg)', height: '150%', width: 'auto', maxWidth: 'none' } : {}}
                  className={`rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] ${selectedItem.card.type === 'Battlefield' ? '' : 'w-full h-full object-contain'}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 200 300"><rect width="200" height="300" fill="%23222"/><text x="100" y="150" fill="%23666" text-anchor="middle" dominant-baseline="middle">Card Missing</text></svg>';
                  }}
                />
              </div>
            </div>

            {/* Right: Card Details */}
            <div className="w-full md:w-[55%] lg:w-[60%] p-8 overflow-y-auto max-h-[80vh] flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-3xl font-bold">{selectedItem.card.name}, {selectedItem.card.code}</h2>
                {selectedItem.print && selectedItem.print !== 'Normal' && (
                  <span className="bg-purple-900/40 text-purple-400 text-sm px-2.5 py-1 rounded font-bold border border-purple-800/50 mt-1">
                    {selectedItem.print}
                  </span>
                )}
              </div>
              
              {/* Badges Row 1 */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] border border-[#333] rounded-md text-sm font-medium">
                  {selectedItem.card.rarity && (
                    <img 
                      src={`/rarity/${selectedItem.card.rarity.toLowerCase()}.webp`} 
                      alt={selectedItem.card.rarity} 
                      className="w-5 h-5 object-contain"
                      onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                    />
                  )}
                  {selectedItem.card.type}
                </div>
                {selectedItem.card.detail?.Color?.map((c: string, i: number) => (
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
                {selectedItem.card.detail?.Tag?.map((tag: string, i: number) => (
                  <div key={`t-${i}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] border border-[#333] rounded-md text-sm font-medium">
                    {tag}
                  </div>
                ))}
              </div>

              {/* Stats Box */}
              {(selectedItem.card.detail?.Energy || selectedItem.card.detail?.Power || selectedItem.card.detail?.Might) && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="flex flex-col items-center justify-center bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                    <span className="text-gray-400 text-sm mb-1">Energy</span>
                    <span className="text-4xl font-bold">{selectedItem.card.detail?.Energy || '-'}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                    <span className="text-gray-400 text-sm mb-1">Power</span>
                    <span className="text-4xl font-bold">{selectedItem.card.detail?.Power || '-'}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                    <span className="text-gray-400 text-sm mb-1">Might</span>
                    <span className="text-4xl font-bold">{selectedItem.card.detail?.Might || '-'}</span>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedItem.card.detail?.Ability && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-2">Ability</h3>
                  <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {renderAbilityText(selectedItem.card.detail?.Ability)}
                  </div>
                </div>
              )}

              {/* Flavor Text / Equip Effect */}
              {(selectedItem.card.detail?.["Equip Effect"] || selectedItem.card.detail?.["Equip Might"] !== undefined) ? (
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  {selectedItem.card.detail?.["Equip Effect"] ? (
                    <div className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-xl p-4 sm:p-6">
                      <h3 className="text-lg font-bold mb-2">Equip Effect</h3>
                      <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {renderAbilityText(selectedItem.card.detail?.["Equip Effect"])}
                      </div>
                    </div>
                  ) : selectedItem.card.detail?.["Flavor Text"] ? (
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-lg font-bold mb-2">Flavor Text</h3>
                      <p className="text-gray-500 italic leading-relaxed whitespace-pre-wrap">
                        {selectedItem.card.detail?.["Flavor Text"]}
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}
                  {selectedItem.card.detail?.["Equip Might"] !== undefined && (
                    <div className="w-full sm:w-32 bg-[#1a1a1a] border border-[#333] rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center shrink-0">
                      <span className="text-gray-400 text-sm mb-1 text-center">Equip Might</span>
                      <span className="text-4xl font-bold">{selectedItem.card.detail?.["Equip Might"]}</span>
                    </div>
                  )}
                </div>
              ) : selectedItem.card.detail?.["Flavor Text"] ? (
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-2">Flavor Text</h3>
                  <p className="text-gray-500 italic leading-relaxed whitespace-pre-wrap">
                    {selectedItem.card.detail?.["Flavor Text"]}
                  </p>
                </div>
              ) : null}

              {/* Spacer to push checkout block to bottom if needed */}
              <div className="flex-1"></div>

              {/* Checkout / Add to cart */}
              <div className="mt-8 border-t border-[#333] pt-6 flex items-center justify-between">
                <div className="flex gap-8">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">ราคาเริ่มต้น</div>
                    <div className="text-3xl font-bold text-[var(--primary)]">฿{selectedItem.price}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">จำนวนคงเหลือ</div>
                    <div className="text-xl font-bold text-white mt-1">{selectedItem.quantity}</div>
                  </div>
                </div>
                <button 
                  className="bg-[#222] hover:bg-[var(--primary)] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors border border-[#444] hover:border-[var(--primary)] group"
                  onClick={() => {
                    addToCart(selectedItem);
                  }}
                >
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  เพิ่มลงตะกร้า
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

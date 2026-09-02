"use client";

import React from "react";

export default function CardModal({ selectedCard, onClose }: { selectedCard: any, onClose: () => void }) {
  if (!selectedCard) return null;

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

  return (
    <>
      {/* Modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-sm" onClick={() => onClose()}>
          <div 
            className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-2"
              onClick={() => onClose()}
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
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="flex flex-col items-center justify-center bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                    <span className="text-gray-400 text-sm mb-1">Energy</span>
                    <span className="text-4xl font-bold">{selectedCard.detail?.Energy || '-'}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                    <span className="text-gray-400 text-sm mb-1">Power</span>
                    <span className="text-4xl font-bold">{selectedCard.detail?.Power || '-'}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
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

              {/* Flavor Text (Original) - Show only if we don't move it to Equip Section */}
              {selectedCard.detail?.["Flavor Text"] && (selectedCard.detail?.["Equip Effect"] || selectedCard.detail?.["Equip Might"] === undefined) && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-2">Flavor Text</h3>
                  <p className="text-gray-500 italic leading-relaxed whitespace-pre-wrap">
                    {selectedCard.detail?.["Flavor Text"]}
                  </p>
                </div>
              )}

              {/* Equip Section */}
              {(selectedCard.detail?.["Equip Effect"] || selectedCard.detail?.["Equip Might"] !== undefined) && (
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  {/* Left Box: Equip Effect OR Flavor Text OR Empty space */}
                  {selectedCard.detail?.["Equip Effect"] ? (
                    <div className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-xl p-4 sm:p-6">
                      <h3 className="text-lg font-bold mb-2">Equip Effect</h3>
                      <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {renderAbilityText(selectedCard.detail?.["Equip Effect"])}
                      </div>
                    </div>
                  ) : selectedCard.detail?.["Flavor Text"] ? (
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-lg font-bold mb-2">Flavor Text</h3>
                      <p className="text-gray-500 italic leading-relaxed whitespace-pre-wrap">
                        {selectedCard.detail?.["Flavor Text"]}
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}

                  {/* Right Box: Equip Might */}
                  {selectedCard.detail?.["Equip Might"] !== undefined && (
                    <div className="w-full sm:w-32 bg-[#1a1a1a] border border-[#333] rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center shrink-0">
                      <span className="text-gray-400 text-sm mb-1 text-center">Equip Might</span>
                      <span className="text-4xl font-bold">{selectedCard.detail?.["Equip Might"]}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

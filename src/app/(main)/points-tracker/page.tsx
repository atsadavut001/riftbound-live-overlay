"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PointsTrackerSetupPage() {
  const router = useRouter();
  const [legends, setLegends] = useState<any[]>([]);
  const [opponentLegendId, setOpponentLegendId] = useState("");
  const [playerLegendId, setPlayerLegendId] = useState("");
  const [showLegendSelect, setShowLegendSelect] = useState<"player" | "opponent" | null>(null);
  const [legendSearch, setLegendSearch] = useState("");
  const [legendPage, setLegendPage] = useState(1);
  
  const [isFlipping, setIsFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<"หัว" | "ก้อย" | null>(null);

  useEffect(() => {
    // Fetch Legend cards
    const fetchLegends = async () => {
      try {
        const res = await fetch("/api/admin/cards?type=Legend&limit=100");
        if (res.ok) {
          const data = await res.json();
          setLegends(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch legends", err);
      }
    };
    fetchLegends();
  }, []);

  const opponentLegend = legends.find(l => l.id === opponentLegendId);
  const playerLegend = legends.find(l => l.id === playerLegendId);

  const tossCoin = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    
    const result = Math.random() > 0.5 ? "หัว" : "ก้อย";
    setCoinResult(result);
    
    // Simulate coin toss delay
    setTimeout(() => {
      setIsFlipping(false);
    }, 1500);
  };

  const handleStartGame = () => {

    // Redirect to the actual game page with parameters
    router.push(`/play-tracker?p=${playerLegendId}&o=${opponentLegendId}`);
  };

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-8 text-center text-[var(--primary)]">Points Tracker Setup</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* Opponent Card */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 flex flex-col items-center shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-red-400">ฝั่งตรงข้าม (Opponent)</h2>
          
          <button 
            onClick={() => setShowLegendSelect("opponent")}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-left text-white focus:outline-none focus:border-red-500 mb-6 flex justify-between items-center hover:bg-[#222] transition-colors"
          >
            <span className={opponentLegend ? "text-white" : "text-gray-400"}>
              {opponentLegend ? `${opponentLegend.name} (${opponentLegend.code})` : "-- ค้นหาและเลือก Legend --"}
            </span>
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          <div className="w-full aspect-[2/3] max-w-[280px] bg-[#111] border border-[#333] rounded-xl overflow-hidden relative flex items-center justify-center">
            {opponentLegend ? (
              <img 
                src={opponentLegend.imageUrl} 
                alt={opponentLegend.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : (
              <div className="flex flex-col items-center text-gray-600 gap-2">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>ยังไม่ได้เลือก</span>
              </div>
            )}
            <div className={`absolute inset-0 flex items-center justify-center text-xs text-gray-500 bg-[#111] hidden`}>
              Image Not Found
            </div>
          </div>
        </div>
        
        {/* Player Card */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 flex flex-col items-center shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-blue-400">คุณ (You)</h2>
          
          <button 
            onClick={() => setShowLegendSelect("player")}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-left text-white focus:outline-none focus:border-blue-500 mb-6 flex justify-between items-center hover:bg-[#222] transition-colors"
          >
            <span className={playerLegend ? "text-white" : "text-gray-400"}>
              {playerLegend ? `${playerLegend.name} (${playerLegend.code})` : "-- ค้นหาและเลือก Legend --"}
            </span>
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          <div className="w-full aspect-[2/3] max-w-[280px] bg-[#111] border border-[#333] rounded-xl overflow-hidden relative flex items-center justify-center">
            {playerLegend ? (
              <img 
                src={playerLegend.imageUrl} 
                alt={playerLegend.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : (
              <div className="flex flex-col items-center text-gray-600 gap-2">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>ยังไม่ได้เลือก</span>
              </div>
            )}
            <div className={`absolute inset-0 flex items-center justify-center text-xs text-gray-500 bg-[#111] hidden`}>
              Image Not Found
            </div>
          </div>
        </div>

      </div>

      {/* Coin Toss Card */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-8 flex flex-col items-center mb-8 shadow-lg">
        <h3 className="text-xl font-bold mb-6 text-white">โยนหัวก้อยเพื่อเริ่มเกม</h3>
        
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes coin-flip-heads {
            0% { transform: rotateY(0deg) scale(1); }
            50% { transform: rotateY(900deg) scale(1.5); }
            100% { transform: rotateY(1800deg) scale(1.4); }
          }
          @keyframes coin-flip-tails {
            0% { transform: rotateY(0deg) scale(1); }
            50% { transform: rotateY(990deg) scale(1.5); }
            100% { transform: rotateY(1980deg) scale(1.4); }
          }
        `}} />

        <div className="h-40 flex flex-col items-center justify-center mb-6" style={{ perspective: "1000px" }}>
          {!isFlipping && !coinResult ? (
            <div className="w-28 h-28 rounded-full border-2 border-[#444] border-dashed flex items-center justify-center">
              <span className="text-gray-500 text-4xl font-bold">?</span>
            </div>
          ) : (
            <div 
              className="relative w-28 h-28"
              style={{
                transformStyle: "preserve-3d",
                animation: isFlipping ? (coinResult === "หัว" ? "coin-flip-heads 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards" : "coin-flip-tails 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards") : "none",
                transform: !isFlipping && coinResult ? (coinResult === "หัว" ? "rotateY(0deg) scale(1.4)" : "rotateY(180deg) scale(1.4)") : "none",
                transition: !isFlipping ? "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)" : "none"
              }}
            >
              {/* Front (หัว) */}
              <div className="absolute inset-0 rounded-full border-4 border-yellow-500 bg-gradient-to-br from-yellow-700 to-yellow-900 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.4)]" style={{ backfaceVisibility: "hidden" }}>
                <span className="font-black text-4xl text-yellow-100">หัว</span>
              </div>
              
              {/* Back (ก้อย) */}
              <div className="absolute inset-0 rounded-full border-4 border-slate-400 bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-[0_0_30px_rgba(148,163,184,0.4)]" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                <span className="font-black text-4xl text-white">ก้อย</span>
              </div>
            </div>
          )}
        </div>
        
        <button 
          onClick={tossCoin}
          disabled={isFlipping}
          className={`px-8 py-3 rounded-xl font-bold text-lg transition-all ${isFlipping ? "bg-[#333] text-gray-500 cursor-not-allowed" : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-lg hover:shadow-[var(--primary)]/30 hover:-translate-y-1"}`}
        >
          {isFlipping ? "กำลังทอย..." : "ทอย หัวก้อย"}
        </button>
      </div>

      {/* Start Game Button */}
      <button 
        onClick={handleStartGame}
        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold text-xl py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(22,163,74,0.3)] hover:shadow-[0_0_30px_rgba(22,163,74,0.5)] hover:-translate-y-1 mb-8"
      >
        เริ่มเกม
      </button>

      {/* Legend Select Modal */}
      {showLegendSelect && (() => {
        const filteredLegends = legends.filter(c => c.name.toLowerCase().includes(legendSearch.toLowerCase()) || c.code.toLowerCase().includes(legendSearch.toLowerCase()));
        const totalPages = Math.max(1, Math.ceil(filteredLegends.length / 15));
        const paginatedLegends = filteredLegends.slice((legendPage - 1) * 15, legendPage * 15);
        
        return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#111]">
              <h3 className="text-xl font-bold">
                เลือก Legend {showLegendSelect === "player" ? "ของคุณ" : "ฝั่งตรงข้าม"}
              </h3>
              <button onClick={() => { setShowLegendSelect(null); setLegendSearch(""); setLegendPage(1); }} className="p-2 text-gray-400 hover:text-white bg-[#222] rounded-lg">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-4 border-b border-[#333] bg-[#1a1a1a]">
              <div className="relative">
                <input 
                  type="text" 
                  value={legendSearch}
                  onChange={e => { setLegendSearch(e.target.value); setLegendPage(1); }}
                  placeholder="ค้นหาชื่อการ์ด..." 
                  className="w-full bg-[#111] border border-[#333] rounded-lg pl-10 pr-4 py-3 text-white outline-none focus:border-[var(--primary)]"
                />
                <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 content-start">
              {legendPage === 1 && (
                <div 
                  onClick={() => {
                    if (showLegendSelect === "player") setPlayerLegendId("");
                    else setOpponentLegendId("");
                    setShowLegendSelect(null);
                    setLegendSearch("");
                    setLegendPage(1);
                  }}
                  className="relative w-full pb-[150%] border-2 border-dashed border-[#444] rounded-xl cursor-pointer hover:bg-[#222] hover:border-gray-400 transition-all"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm text-gray-500">ไม่เลือก</span>
                  </div>
                </div>
              )}
              
              {paginatedLegends.map(card => (
                <div 
                  key={card.id}
                  onClick={() => {
                    if (showLegendSelect === "player") setPlayerLegendId(card.id);
                    else setOpponentLegendId(card.id);
                    setShowLegendSelect(null);
                    setLegendSearch("");
                    setLegendPage(1);
                  }}
                  className={`relative w-full pb-[150%] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                    (showLegendSelect === "player" ? playerLegendId === card.id : opponentLegendId === card.id) 
                      ? 'border-[var(--primary)] shadow-[0_0_15px_var(--primary)]' 
                      : 'border-transparent hover:border-[#555]'
                  }`}
                >
                  <img src={card.imageUrl} alt={card.name} className="absolute inset-0 w-full h-full object-contain bg-[#111]" />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[#333] bg-[#111] flex justify-between items-center">
                <button 
                  onClick={() => setLegendPage(p => Math.max(1, p - 1))}
                  disabled={legendPage === 1}
                  className="px-4 py-2 bg-[#222] hover:bg-[#333] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ก่อนหน้า
                </button>
                <span className="text-gray-400 text-sm">
                  หน้า {legendPage} จาก {totalPages}
                </span>
                <button 
                  onClick={() => setLegendPage(p => Math.min(totalPages, p + 1))}
                  disabled={legendPage === totalPages}
                  className="px-4 py-2 bg-[#222] hover:bg-[#333] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ถัดไป
                </button>
              </div>
            )}
          </div>
        </div>
        );
      })()}

    </div>
  );
}

"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PlayTrackerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentXP, setOpponentXP] = useState(0);
  const [playerXP, setPlayerXP] = useState(0);
  const [showOpponentXP, setShowOpponentXP] = useState(false);
  const [showPlayerXP, setShowPlayerXP] = useState(false);
  
  // Timer state
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  
  // Modals state
  const [showMenu, setShowMenu] = useState(false);
  const [showCoinToss, setShowCoinToss] = useState(false);
  const [showLegendSelect, setShowLegendSelect] = useState<"player" | "opponent" | null>(null);
  
  // Legends data
  const [legends, setLegends] = useState<any[]>([]);
  const [legendSearch, setLegendSearch] = useState("");
  const [legendPage, setLegendPage] = useState(1);
  const [playerLegendId, setPlayerLegendId] = useState(searchParams?.get("p") || "");
  const [opponentLegendId, setOpponentLegendId] = useState(searchParams?.get("o") || "");
  
  // Coin toss state
  const [isFlipping, setIsFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<"หัว" | "ก้อย" | null>(null);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Fetch Legends Effect
  useEffect(() => {
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
    setShowMenu(false);
  };

  const handleNewGame = () => {
    setOpponentScore(0);
    setPlayerScore(0);
    setOpponentXP(0);
    setPlayerXP(0);
    setShowOpponentXP(false);
    setShowPlayerXP(false);
    setTimeElapsed(0);
    setIsTimerRunning(true);
    setShowMenu(false);
  };

  const handleEndGame = () => {
    setIsTimerRunning(false);
    setShowMenu(false);
  };

  const tossCoin = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    
    const result = Math.random() > 0.5 ? "หัว" : "ก้อย";
    setCoinResult(result);
    
    setTimeout(() => {
      setIsFlipping(false);
    }, 1500);
  };

  const pLegend = legends.find(l => l.id === playerLegendId);
  const oLegend = legends.find(l => l.id === opponentLegendId);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-white flex flex-col overflow-hidden select-none">
      
      {/* Opponent Area (Top) - Rotated 180deg for mobile/head-to-head play */}
      <div className="flex-1 relative flex flex-col items-center border-b border-[#333] group rotate-180">
        {/* Background Legend Image (Blurred/Faded) */}
        {oLegend && (
          <div className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${oLegend.imageUrl})` }}></div>
        )}
        
        <div className="absolute top-4 w-full flex justify-between px-4 sm:px-6 z-10 text-gray-400">
          <span className="text-sm sm:text-xl font-bold tracking-widest uppercase">Opponent</span>
          <span className="text-sm sm:text-base">{oLegend ? oLegend.name : "No Legend"}</span>
        </div>
        
        {/* Score and XP Counter (Anchored to top / Center Bar) */}
        <div className="flex flex-col items-center z-10 pt-8 sm:pt-12">
          <div className="flex items-center gap-4 sm:gap-8">
            <button 
              onClick={() => setOpponentScore(Math.max(0, opponentScore - 1))}
              className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-[#222]/80 flex items-center justify-center text-4xl sm:text-5xl hover:bg-[#333] transition-colors active:scale-95"
            >-</button>
            
            <div className="text-[120px] sm:text-[180px] font-black leading-none w-40 sm:w-64 text-center text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)] mb-4">
              {opponentScore}
            </div>
            
            <button 
              onClick={() => setOpponentScore(opponentScore + 1)}
              className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-[#222]/80 flex items-center justify-center text-4xl sm:text-5xl hover:bg-[#333] transition-colors active:scale-95"
            >+</button>
          </div>

          {/* XP Counter */}
          {showOpponentXP && (
            <div className="flex items-center gap-4 mt-2 sm:mt-4 bg-black/60 p-4 rounded-3xl border border-[#333] backdrop-blur-md">
              <button 
                onClick={() => setOpponentXP(Math.max(0, opponentXP - 1))}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#222] flex items-center justify-center text-2xl hover:bg-[#333] text-purple-400 transition-colors"
              >-</button>
              <div className="text-4xl sm:text-5xl font-bold w-32 sm:w-40 text-center text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                {opponentXP} XP
              </div>
              <button 
                onClick={() => setOpponentXP(opponentXP + 1)}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#222] flex items-center justify-center text-2xl hover:bg-[#333] text-purple-400 transition-colors"
              >+</button>
            </div>
          )}
        </div>

        {/* XP Toggle Button (Anchored to bottom / Screen Edge) */}
        <div className="z-10 mt-auto pb-6 sm:pb-8">
          <button 
            onClick={() => setShowOpponentXP(!showOpponentXP)}
            className={`px-6 py-2 rounded-full font-bold transition-colors ${showOpponentXP ? 'bg-[#333] text-gray-400' : 'bg-red-900/50 text-red-300 hover:bg-red-800/50 border border-red-500/30'}`}
          >
            {showOpponentXP ? "ปิด XP" : "เพิ่ม XP"}
          </button>
        </div>
      </div>

      {/* Center Control Bar */}
      <div className="h-16 sm:h-24 bg-[#111] border-b border-[#333] flex items-center justify-between px-2 sm:px-8 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-20">
        <button 
          onClick={() => router.push('/points-tracker')}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-[#222] hover:bg-[#333] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          <span className="hidden sm:inline">ย้อนกลับ</span>
        </button>

        <div 
          className="text-2xl sm:text-4xl font-mono font-bold tracking-wider text-[var(--primary)] cursor-pointer hover:text-white transition-colors"
          onClick={() => setIsTimerRunning(!isTimerRunning)}
        >
          {formatTime(timeElapsed)}
        </div>

        <div className="flex gap-2 sm:gap-4">
          <button 
            onClick={() => { setShowCoinToss(true); setCoinResult(null); }}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-[#222] hover:bg-[#333] transition-colors"
          >
            <span className="hidden sm:inline">ทอยเหรียญ</span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-yellow-600 border border-yellow-400"></div>
          </button>
          
          <button 
            onClick={() => setShowMenu(true)}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors text-white"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            <span className="hidden sm:inline font-bold">เมนู</span>
          </button>
        </div>
      </div>

      {/* Player Area (Bottom) */}
      <div className="flex-1 relative flex flex-col items-center group">
        {/* Background Legend Image (Blurred/Faded) */}
        {pLegend && (
          <div className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${pLegend.imageUrl})` }}></div>
        )}
        
        <div className="absolute bottom-4 w-full flex justify-between px-4 sm:px-6 z-10 text-gray-400">
          <span className="text-sm sm:text-xl font-bold tracking-widest uppercase">You</span>
          <span className="text-sm sm:text-base">{pLegend ? pLegend.name : "No Legend"}</span>
        </div>

        {/* Score and XP Counter (Anchored to top / Center Bar) */}
        <div className="flex flex-col items-center z-10 pt-8 sm:pt-12">
          <div className="flex items-center gap-4 sm:gap-8">
            <button 
              onClick={() => setPlayerScore(Math.max(0, playerScore - 1))}
              className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-[#222]/80 flex items-center justify-center text-4xl sm:text-5xl hover:bg-[#333] transition-colors active:scale-95"
            >-</button>
            
            <div className="text-[120px] sm:text-[180px] font-black leading-none w-40 sm:w-64 text-center text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] mb-4">
              {playerScore}
            </div>
            
            <button 
              onClick={() => setPlayerScore(playerScore + 1)}
              className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-[#222]/80 flex items-center justify-center text-4xl sm:text-5xl hover:bg-[#333] transition-colors active:scale-95"
            >+</button>
          </div>

          {/* XP Counter */}
          {showPlayerXP && (
            <div className="flex items-center gap-4 mt-2 sm:mt-4 bg-black/60 p-4 rounded-3xl border border-[#333] backdrop-blur-md">
              <button 
                onClick={() => setPlayerXP(Math.max(0, playerXP - 1))}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#222] flex items-center justify-center text-2xl hover:bg-[#333] text-teal-400 transition-colors"
              >-</button>
              <div className="text-4xl sm:text-5xl font-bold w-32 sm:w-40 text-center text-teal-500 drop-shadow-[0_0_10px_rgba(20,184,166,0.4)]">
                {playerXP} XP
              </div>
              <button 
                onClick={() => setPlayerXP(playerXP + 1)}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#222] flex items-center justify-center text-2xl hover:bg-[#333] text-teal-400 transition-colors"
              >+</button>
            </div>
          )}
        </div>

        {/* XP Toggle Button (Anchored to bottom / Screen Edge) */}
        <div className="z-10 mt-auto pb-6 sm:pb-8">
          <button 
            onClick={() => setShowPlayerXP(!showPlayerXP)}
            className={`px-6 py-2 rounded-full font-bold transition-colors ${showPlayerXP ? 'bg-[#333] text-gray-400' : 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50 border border-blue-500/30'}`}
          >
            {showPlayerXP ? "ปิด XP" : "เพิ่ม XP"}
          </button>
        </div>
      </div>

      {/* Menu Modal */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowMenu(false)}>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-sm p-2 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold p-4 pb-2 text-center text-gray-300">เมนูเกม</h3>
            
            <button onClick={() => { setShowLegendSelect("opponent"); setShowMenu(false); }} className="w-full p-4 text-left hover:bg-[#222] rounded-xl transition-colors flex justify-between items-center text-red-400">
              เลือก Legend ฝั่งตรงข้าม
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <button onClick={() => { setShowLegendSelect("player"); setShowMenu(false); }} className="w-full p-4 text-left hover:bg-[#222] rounded-xl transition-colors flex justify-between items-center text-blue-400">
              เลือก Legend คุณ
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <button onClick={toggleFullscreen} className="w-full p-4 text-left hover:bg-[#222] rounded-xl transition-colors flex justify-between items-center text-white">
              เต็มจอ
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </button>
            <button onClick={handleNewGame} className="w-full p-4 text-left hover:bg-[#222] rounded-xl transition-colors flex justify-between items-center text-green-400">
              เกมใหม่
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <button onClick={handleEndGame} className="w-full p-4 text-left hover:bg-[#222] rounded-xl transition-colors flex justify-between items-center text-yellow-500">
              จบเกม (หยุดเวลา)
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
            </button>
            
            <div className="h-[1px] bg-[#333] my-2"></div>
            
            <button onClick={() => setShowMenu(false)} className="w-full p-4 text-center hover:bg-[#222] rounded-xl transition-colors text-gray-500">
              ปิด
            </button>
          </div>
        </div>
      )}

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

      {/* Coin Toss Modal */}
      {showCoinToss && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => !isFlipping && setShowCoinToss(false)}>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-3xl p-10 flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-8 text-white">ทอยหัวก้อย</h3>
            
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

            <div className="h-48 flex flex-col items-center justify-center mb-8" style={{ perspective: "1000px" }}>
              {!isFlipping && !coinResult ? (
                <div className="w-36 h-36 rounded-full border-2 border-[#444] border-dashed flex items-center justify-center">
                  <span className="text-gray-500 text-5xl font-bold">?</span>
                </div>
              ) : (
                <div 
                  className="relative w-36 h-36"
                  style={{
                    transformStyle: "preserve-3d",
                    animation: isFlipping ? (coinResult === "หัว" ? "coin-flip-heads 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards" : "coin-flip-tails 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards") : "none",
                    transform: !isFlipping && coinResult ? (coinResult === "หัว" ? "rotateY(0deg) scale(1.4)" : "rotateY(180deg) scale(1.4)") : "none",
                    transition: !isFlipping ? "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)" : "none"
                  }}
                >
                  <div className="absolute inset-0 rounded-full border-[5px] border-yellow-500 bg-gradient-to-br from-yellow-700 to-yellow-900 flex items-center justify-center shadow-[0_0_40px_rgba(234,179,8,0.5)]" style={{ backfaceVisibility: "hidden" }}>
                    <span className="font-black text-5xl text-yellow-100">หัว</span>
                  </div>
                  <div className="absolute inset-0 rounded-full border-[5px] border-slate-400 bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-[0_0_40px_rgba(148,163,184,0.5)]" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    <span className="font-black text-5xl text-white">ก้อย</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowCoinToss(false)}
                disabled={isFlipping}
                className="px-6 py-3 rounded-xl font-bold text-gray-400 bg-[#222] hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                ปิด
              </button>
              <button 
                onClick={tossCoin}
                disabled={isFlipping}
                className="px-8 py-3 rounded-xl font-bold text-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-lg hover:shadow-[var(--primary)]/30 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
              >
                {isFlipping ? "กำลังทอย..." : (coinResult ? "ทอยอีกครั้ง" : "ทอยเหรียญ")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export default function PlayTrackerPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black text-white">Loading...</div>}>
      <PlayTrackerContent />
    </Suspense>
  );
}


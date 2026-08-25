"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";

function OverlayContent({ id }: { id: string }) {
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch(`/api/overlay/${id}`);
        if (res.ok) {
          const data = await res.json();
          setState(data);
        }
      } catch (e) {
        console.error("Failed to fetch overlay state", e);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
  }, [id]);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (state?.timerPausedRemaining !== undefined && state?.timerPausedRemaining !== null) {
      setTimeLeft(Math.floor(state.timerPausedRemaining / 1000));
      return;
    }

    if (!state?.timerEndTime) {
      setTimeLeft(null);
      return;
    }
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((state.timerEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 200);
    
    return () => clearInterval(interval);
  }, [state?.timerEndTime, state?.timerPausedRemaining]);

  const [localShowCard, setLocalShowCard] = useState(false);

  useEffect(() => {
    setLocalShowCard(state?.cards?.cardVisible || false);
    if (state?.cards?.cardVisible && !state?.cards?.holdCard && state?.cards?.displaySeconds > 0) {
      const ms = state.cards.displaySeconds * 1000;
      const elapsed = Date.now() - (state.cards.cardShowTimestamp || Date.now());
      const remaining = ms - elapsed;
      
      if (remaining > 0) {
        const timer = setTimeout(() => {
          setLocalShowCard(false);
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        setLocalShowCard(false);
      }
    }
  }, [state?.cards?.cardVisible, state?.cards?.holdCard, state?.cards?.displaySeconds, state?.cards?.cardShowTimestamp]);

  if (!state) return null;

  const maxPoints = Math.min(Math.max(state.maxPoints || 8, 8), 10);
  const leftArray = Array.from({ length: maxPoints - 1 }, (_, i) => i + 1);
  const rightArray = [...leftArray].reverse();

  const p1Points = state.points?.a || 0;
  const p2Points = state.points?.b || 0;

  const layout = state.layout || "none";
  const bgImageUrl = layout === "cam" ? "https://qugqegaqjrcwkxnvohvv.supabase.co/storage/v1/object/public/ZberusTCG/layout_overlay/layout_cam.webp" : "https://qugqegaqjrcwkxnvohvv.supabase.co/storage/v1/object/public/ZberusTCG/layout_overlay/layout_none_cam.webp";

  return (
    <div className={`w-screen h-screen fixed inset-0 overflow-hidden text-white font-sans`}>
      {/* Legend Cards (Behind Layout) */}
      <div 
        className="absolute z-0 overflow-hidden bg-white"
        style={layout === 'cam' 
          ? { left: '43px', top: '88px', width: '275px', height: '141px' }
          : { left: '40px', top: '246px', width: '281px', height: '299px' }
        }
      >
        {state.players?.[0]?.legendCard?.imageUrl && (
          <img 
            src={state.players[0].legendCard.imageUrl} 
            alt="P1 Legend"
            className="w-full h-full object-cover" 
            style={{ objectPosition: '50% 10%' }}
          />
        )}
        <div className="absolute bottom-0 left-0 w-full h-[35%] bg-gradient-to-t from-black/90 to-transparent"></div>
      </div>

      <div 
        className="absolute z-0 overflow-hidden bg-white"
        style={layout === 'cam'
          ? { left: '1606px', top: '88px', width: '275px', height: '141px' }
          : { left: '1603px', top: '246px', width: '281px', height: '299px' }
        }
      >
        {state.players?.[1]?.legendCard?.imageUrl && (
          <img 
            src={state.players[1].legendCard.imageUrl} 
            alt="P2 Legend"
            className="w-full h-full object-cover" 
            style={{ objectPosition: '50% 10%' }}
          />
        )}
        <div className="absolute bottom-0 left-0 w-full h-[35%] bg-gradient-to-t from-black/90 to-transparent"></div>
      </div>

      {/* Battlefield Cards (Behind Layout) */}
      <div 
        className="absolute z-0 flex items-center justify-center overflow-hidden bg-white" 
        style={{ left: '35px', top: '545px', width: '291px', height: '90px' }}
      >
        {state.players?.[0]?.battlefieldCard?.imageUrl && (
          <img 
            src={state.players[0].battlefieldCard.imageUrl} 
            alt="P1 Battlefield"
            className="object-cover" 
            style={{ width: '90px', height: '291px', transform: 'rotate(90deg) scale(1.1)', objectPosition: 'center' }}
          />
        )}
      </div>

      <div 
        className="absolute z-0 flex items-center justify-center overflow-hidden bg-white" 
        style={{ left: '1598px', top: '545px', width: '291px', height: '90px' }}
      >
        {state.players?.[1]?.battlefieldCard?.imageUrl && (
          <img 
            src={state.players[1].battlefieldCard.imageUrl} 
            alt="P2 Battlefield"
            className="object-cover" 
            style={{ width: '90px', height: '291px', transform: 'rotate(-90deg) scale(1.1)', objectPosition: 'center' }} 
          />
        )}
      </div>

      {/* Main Layout Background */}
      <img src={bgImageUrl} alt="Layout Background" className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none" />

      <div className="absolute top-4 left-0 w-full grid grid-cols-[1fr_auto_1fr] items-center px-8 gap-[4px] z-20">
        
        {/* Left Side */}
        <div className="flex items-center justify-end gap-[4px]">
          {leftArray.map((num) => (
            <img 
              key={`left-${num}`} 
              src={`https://qugqegaqjrcwkxnvohvv.supabase.co/storage/v1/object/public/ZberusTCG/layout_overlay/points/${num}_${num === p1Points ? 'full' : 'empty'}.webp`} 
              alt={`${num}`} 
              className="w-[48px] object-contain shrink-0" 
            />
          ))}
        </div>

        {/* Center */}
        <div className="flex items-center justify-center">
          <img 
            src={`https://qugqegaqjrcwkxnvohvv.supabase.co/storage/v1/object/public/ZberusTCG/layout_overlay/points/${maxPoints}_${(p1Points === maxPoints || p2Points === maxPoints) ? 'full' : 'empty'}.webp`} 
            alt={`${maxPoints}`} 
            className="w-[64px] object-contain shrink-0" 
          />
        </div>

        {/* Right Side */}
        <div className="flex items-center justify-start gap-[4px]">
          {rightArray.map((num) => (
            <img 
              key={`right-${num}`} 
              src={`https://qugqegaqjrcwkxnvohvv.supabase.co/storage/v1/object/public/ZberusTCG/layout_overlay/points/${num}_${num === p2Points ? 'full' : 'empty'}.webp`} 
              alt={`${num}`} 
              className="w-[48px] object-contain shrink-0" 
            />
          ))}
        </div>

      </div>

      {/* Player Names */}
      <div className={`absolute left-[43px] w-[275px] h-[56px] flex items-center justify-center text-center whitespace-nowrap text-3xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10 ${layout === 'cam' ? 'top-[24px]' : 'top-[181px]'}`}>
        {state.players?.[0]?.name || "Player 1"}
      </div>
      <div className={`absolute left-[1606px] w-[275px] h-[56px] flex items-center justify-center text-center whitespace-nowrap text-3xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10 ${layout === 'cam' ? 'top-[24px]' : 'top-[181px]'}`}>
        {state.players?.[1]?.name || "Player 2"}
      </div>

      {/* Legend & Champion Names */}
      <div 
        className="absolute z-20 flex flex-col items-center justify-end pb-1 pointer-events-none drop-shadow-md [-webkit-text-stroke:1px_black] tracking-wide text-center" 
        style={layout === 'cam' 
          ? { left: '43px', top: '88px', width: '275px', height: '141px' }
          : { left: '40px', top: '246px', width: '281px', height: '274px' }
        }
      >
        <span className="text-white font-extrabold text-lg leading-none">{state.players?.[0]?.legendName || "Legend"}</span>
        <span className="text-white font-extrabold text-base leading-tight mt-1">{state.players?.[0]?.championName || "Champion"}</span>
      </div>

      <div 
        className="absolute z-20 flex flex-col items-center justify-end pb-1 pointer-events-none drop-shadow-md [-webkit-text-stroke:1px_black] tracking-wide text-center" 
        style={layout === 'cam' 
          ? { left: '1606px', top: '88px', width: '275px', height: '141px' }
          : { left: '1603px', top: '246px', width: '281px', height: '274px' }
        }
      >
        <span className="text-white font-extrabold text-lg leading-none">{state.players?.[1]?.legendName || "Legend"}</span>
        <span className="text-white font-extrabold text-base leading-tight mt-1">{state.players?.[1]?.championName || "Champion"}</span>
      </div>

      {/* Battlefield Names */}
      {state.players?.[0]?.battlefieldName && (
        <div 
          className="absolute z-20 flex items-center justify-center text-white font-extrabold text-xl pointer-events-none drop-shadow-md [-webkit-text-stroke:1px_black] tracking-wide" 
          style={{ left: '35px', top: '545px', width: '291px', height: '90px' }}
        >
          {state.players[0].battlefieldName}
        </div>
      )}
      {state.players?.[1]?.battlefieldName && (
        <div 
          className="absolute z-20 flex items-center justify-center text-white font-extrabold text-xl pointer-events-none drop-shadow-md [-webkit-text-stroke:1px_black] tracking-wide" 
          style={{ left: '1598px', top: '545px', width: '291px', height: '90px' }}
        >
          {state.players[1].battlefieldName}
        </div>
      )}

      {/* Match Format Indicators */}
      {state.format !== 'BO1' && (
        <>
          {/* P1 Match Points */}
          <div 
            className="absolute z-20 flex justify-center items-center gap-3 pointer-events-none"
            style={{ left: '35px', top: '522.5px', width: '291px' }}
          >
            {Array.from({ length: state.format === 'BO5' ? 3 : 2 }).map((_, i) => (
              <div 
                key={`p1-dot-${i}`} 
                className="w-[45px] h-[45px] rounded-full border-2 border-yellow-500 shadow-md bg-black relative flex items-center justify-center overflow-hidden"
              >
                {(state.players?.[0]?.gamesWon || 0) > i && (
                  <img src="https://qugqegaqjrcwkxnvohvv.supabase.co/storage/v1/object/public/ZberusTCG/layout_overlay/RB_riftbound_icon.svg" alt="Win" className="w-[75%] h-[75%] object-contain drop-shadow-md" />
                )}
              </div>
            ))}
          </div>

          {/* P2 Match Points */}
          <div 
            className="absolute z-20 flex justify-center items-center gap-3 pointer-events-none"
            style={{ left: '1598px', top: '522.5px', width: '291px' }}
          >
            {Array.from({ length: state.format === 'BO5' ? 3 : 2 }).map((_, i, arr) => (
              <div 
                key={`p2-dot-${i}`} 
                className="w-[45px] h-[45px] rounded-full border-2 border-yellow-500 shadow-md bg-black relative flex items-center justify-center overflow-hidden"
              >
                {(state.players?.[1]?.gamesWon || 0) > (arr.length - 1 - i) && (
                  <img src="https://qugqegaqjrcwkxnvohvv.supabase.co/storage/v1/object/public/ZberusTCG/layout_overlay/RB_riftbound_icon.svg" alt="Win" className="w-[75%] h-[75%] object-contain drop-shadow-md" />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Countdown Timer Area */}
      {timeLeft !== null && timeLeft >= 0 && (
        <div className="z-20">
          <img src="https://qugqegaqjrcwkxnvohvv.supabase.co/storage/v1/object/public/ZberusTCG/layout_overlay/time.webp" alt="Time Overlay" className="absolute inset-0 w-screen h-screen object-contain pointer-events-none z-20" />
          <div className="absolute left-[178px] bottom-[36px] -translate-x-1/2 -translate-y-1/2 text-5xl font-mono font-bold text-black z-30">
            {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>
      )}

      {/* Cards Overlay */}
      {state?.cards?.showRight && (
        <img 
          src="https://qugqegaqjrcwkxnvohvv.supabase.co/storage/v1/object/public/ZberusTCG/layout_overlay/cartes_right.webp" 
          alt="Right Card Frame" 
          className="absolute inset-0 w-screen h-screen object-contain pointer-events-none z-30" 
        />
      )}
      
      {state?.cards?.showRight && localShowCard && state.cards?.rightCard?.imageUrl && (
        <img
          src={state.cards.rightCard.imageUrl}
          alt="Right Card"
          className="absolute z-[31] object-contain rounded-xl"
          style={{
                left: '1624px',
                top: '708px',
                width: '235px',
                height: '310px',
                opacity: 1
              }}
        />
      )}
    </div>
  );
}

export default function OverlayView() {
  const params = useParams();
  const id = params.id as string;
  return (
    <Suspense fallback={null}>
      <OverlayContent id={id} />
    </Suspense>
  );
}

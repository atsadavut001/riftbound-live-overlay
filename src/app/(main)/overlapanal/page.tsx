"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [overlayUrl, setOverlayUrl] = useState("");
  const [state, setState] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [cardSetupTab, setCardSetupTab] = useState<'manual' | 'import'>('manual');
  const [cardSearch, setCardSearch] = useState("");
  const [cardSearchResults, setCardSearchResults] = useState<any[]>([]);
  const [p1Deck, setP1Deck] = useState<any[]>([]);
  const [p2Deck, setP2Deck] = useState<any[]>([]);
  const [importModalPlayer, setImportModalPlayer] = useState<'p1' | 'p2' | null>(null);
  const [importText, setImportText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const [legendSearch1, setLegendSearch1] = useState("");
  const [legendResults1, setLegendResults1] = useState<any[]>([]);
  const [showLegendResults1, setShowLegendResults1] = useState(false);

  const [legendSearch2, setLegendSearch2] = useState("");
  const [legendResults2, setLegendResults2] = useState<any[]>([]);
  const [showLegendResults2, setShowLegendResults2] = useState(false);

  const [battlefieldSearch1, setBattlefieldSearch1] = useState("");
  const [battlefieldResults1, setBattlefieldResults1] = useState<any[]>([]);
  const [showBattlefieldResults1, setShowBattlefieldResults1] = useState(false);

  const [battlefieldSearch2, setBattlefieldSearch2] = useState("");
  const [battlefieldResults2, setBattlefieldResults2] = useState<any[]>([]);
  const [showBattlefieldResults2, setShowBattlefieldResults2] = useState(false);

  const [championSearch1, setChampionSearch1] = useState("");
  const [championResults1, setChampionResults1] = useState<any[]>([]);
  const [showChampionResults1, setShowChampionResults1] = useState(false);

  const [championSearch2, setChampionSearch2] = useState("");
  const [championResults2, setChampionResults2] = useState<any[]>([]);
  const [showChampionResults2, setShowChampionResults2] = useState(false);

  const legendBase1 = state?.players?.[0]?.legendName ? state.players[0].legendName.split(',')[0].trim() : "";
  const legendBase2 = state?.players?.[1]?.legendName ? state.players[1].legendName.split(',')[0].trim() : "";

  useEffect(() => {
    if (!legendBase1) {
      setChampionResults1([]);
      return;
    }
    const fetchChamps = async () => {
      try {
        const res = await fetch(`/api/admin/cards?limit=100&type=Unit&search=${encodeURIComponent(legendBase1)}`);
        if (res.ok) {
          const data = await res.json();
          setChampionResults1((data.data || []).filter((c: any) => c.name.toLowerCase().includes(legendBase1.toLowerCase())));
        }
      } catch (err) {}
    };
    fetchChamps();
  }, [legendBase1]);

  useEffect(() => {
    if (!legendBase2) {
      setChampionResults2([]);
      return;
    }
    const fetchChamps = async () => {
      try {
        const res = await fetch(`/api/admin/cards?limit=100&type=Unit&search=${encodeURIComponent(legendBase2)}`);
        if (res.ok) {
          const data = await res.json();
          setChampionResults2((data.data || []).filter((c: any) => c.name.toLowerCase().includes(legendBase2.toLowerCase())));
        }
      } catch (err) {}
    };
    fetchChamps();
  }, [legendBase2]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/cards?limit=100&type=Legend&search=${encodeURIComponent(legendSearch1.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setLegendResults1(data.data || []);
        }
      } catch (err) {}
    }, 300);
    return () => clearTimeout(handler);
  }, [legendSearch1]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/cards?limit=100&type=Legend&search=${encodeURIComponent(legendSearch2.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setLegendResults2(data.data || []);
        }
      } catch (err) {}
    }, 300);
    return () => clearTimeout(handler);
  }, [legendSearch2]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/cards?limit=100&type=Battlefield&search=${encodeURIComponent(battlefieldSearch1.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setBattlefieldResults1(data.data || []);
        }
      } catch (err) {}
    }, 300);
    return () => clearTimeout(handler);
  }, [battlefieldSearch1]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/cards?limit=100&type=Battlefield&search=${encodeURIComponent(battlefieldSearch2.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setBattlefieldResults2(data.data || []);
        }
      } catch (err) {}
    }, 300);
    return () => clearTimeout(handler);
  }, [battlefieldSearch2]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/cards?limit=10&search=${encodeURIComponent(cardSearch.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setCardSearchResults(data.data || []);
        }
      } catch (err) {
        console.error("Failed to search cards", err);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [cardSearch]);

  const handleImportDeck = async () => {
    if (!importText.trim() || !importModalPlayer) return;
    setIsImporting(true);
    try {
      const lines = importText.split("\n");
      const namesToFetch = new Set<string>();
      lines.forEach(line => {
        const match = line.match(/^\s*\d+\s+(.+)$/);
        if (match) namesToFetch.add(match[1].trim());
      });

      const promises = Array.from(namesToFetch).map(async (name) => {
        const res = await fetch(`/api/admin/cards?limit=1&search=${encodeURIComponent(name)}`);
        if (res.ok) {
          const data = await res.json();
          return data.data?.[0];
        }
        return null;
      });

      const results = await Promise.all(promises);
      const validCards = results.filter(c => c);

      if (importModalPlayer === 'p1') {
        setP1Deck(validCards);
      } else {
        setP2Deck(validCards);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsImporting(false);
      setImportModalPlayer(null);
      setImportText("");
    }
  };

  const userId = (session?.user as any)?.id;

  const fetchState = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/overlay/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setState(data);
        setOverlayUrl(`${window.location.origin}/overlay/${userId}`);
      }
    } catch (e) {
      console.error(e);
    }
  }, [userId]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const updateState = async (updates: any) => {
    if (!userId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/overlay/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const updatePoints = (player: 'a' | 'b', change: number) => {
    if (!state) return;
    const newPoints = { ...state.points };
    newPoints[player] = Math.max(0, (newPoints[player] || 0) + change);
    updateState({ points: newPoints });
  };

  const updatePlayerName = (index: 0 | 1, name: string) => {
    if (!state) return;
    const newPlayers = [...state.players];
    newPlayers[index] = { ...newPlayers[index], name };
    setState({ ...state, players: newPlayers });
  };

  const savePlayerNames = () => {
    if (!state) return;
    updateState({ players: state.players });
  };

  if (status === "loading") {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Sign in to manage your Overlay</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          You must sign in with a Google account to create a unique Overlay URL for your stream.
        </p>
        <button
          onClick={() => signIn("google")}
          className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
        >
          <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-6 h-6" />
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-8 sm:p-12 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Overlay</h1>
      </div>

      <div className="space-y-8">
          {/* Section: URL Overlay */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--primary)]">Overlay URL for OBS</h2>
            <p className="text-sm text-gray-400 mb-4">
              Copy the link below and add it as a Browser Source in OBS (set Width: 1920, Height: 1080).
            </p>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                readOnly 
                value={overlayUrl} 
                className="flex-1 bg-[#111] border border-[var(--border)] rounded-lg px-4 py-2 text-sm text-gray-300 outline-none"
              />
              <button 
                onClick={() => navigator.clipboard.writeText(overlayUrl)}
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Copy
              </button>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Layout Type</label>
              <select 
                value={state?.layout || "none"} 
                onChange={(e) => {
                  setState({ ...state, layout: e.target.value });
                  updateState({ layout: e.target.value });
                }}
                className="w-full sm:w-1/3 bg-[#111] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              >
                <option value="none">Without Camera (ไม่มีกล้อง)</option>
                <option value="cam">With Camera (มีกล้อง)</option>
              </select>
            </div>
          </div>

          {/* Section: Match Settings */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Match setup</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Format</label>
                <select 
                  value={state?.format || "BO3"}
                  onChange={(e) => updateState({ format: e.target.value })}
                  className="w-full bg-[#111] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                >
                  <option value="BO1">BO1</option>
                  <option value="BO3">BO3</option>
                  <option value="BO5">BO5</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Match Win Points</label>
                <select 
                  value={state?.maxPoints ?? 8}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 8;
                    setState({ ...state, maxPoints: val });
                    updateState({ maxPoints: val });
                  }}
                  className="w-full bg-[#111] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" 
                >
                  <option value={8}>8</option>
                  <option value={9}>9</option>
                  <option value={10}>10</option>
                </select>
              </div>
              <div>
                <button 
                  onClick={() => updateState({ points: { a: 0, b: 0 } })}
                  className="w-full bg-[#222] hover:bg-[#333] text-sm py-2 rounded-md transition-colors border border-[var(--border)] h-[38px]"
                >
                  Reset all points
                </button>
              </div>
            </div>

            {/* Timer Setup */}
            <div className="mt-6 pt-6 border-t border-[var(--border)]">
              <label className="block text-xs text-gray-400 mb-2">Countdown Timer</label>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={state?.timerMinutes ?? 30}
                    onChange={(e) => setState({ ...state, timerMinutes: parseInt(e.target.value) || 0 })}
                    onBlur={() => updateState({ timerMinutes: state.timerMinutes })}
                    className="w-20 bg-[#111] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)] text-center" 
                  />
                  <span className="text-sm text-gray-400">Minutes</span>
                </div>
                
                <button 
                  onClick={() => {
                    const remaining = (state?.timerPausedRemaining !== undefined && state?.timerPausedRemaining !== null && state.timerPausedRemaining > 0)
                      ? state.timerPausedRemaining
                      : (state?.timerMinutes ?? 30) * 60 * 1000;
                    updateState({ timerEndTime: Date.now() + remaining, timerPausedRemaining: null });
                  }}
                  className="flex items-center gap-1.5 bg-[#10b981] hover:bg-[#059669] text-white text-sm px-4 py-2 rounded-md transition-colors font-medium shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  Start
                </button>
                
                <button 
                  onClick={() => {
                    if (state?.timerEndTime) {
                      const remaining = Math.max(0, state.timerEndTime - Date.now());
                      updateState({ timerEndTime: null, timerPausedRemaining: remaining });
                    }
                  }}
                  className="flex items-center gap-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-white text-sm px-4 py-2 rounded-md transition-colors font-medium shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                  Pause
                </button>

                <button 
                  onClick={() => updateState({ timerEndTime: null, timerPausedRemaining: 0 })}
                  className="flex items-center gap-1.5 bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm px-4 py-2 rounded-md transition-colors font-medium shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="5" y="5" width="14" height="14"></rect></svg>
                  Stop
                </button>

                {/* Display Current Timer Status */}
                {state?.timerEndTime && state.timerEndTime > Date.now() ? (
                  <span className="text-sm text-green-400 ml-2 font-medium animate-pulse">
                    Running...
                  </span>
                ) : state?.timerPausedRemaining !== undefined && state?.timerPausedRemaining !== null ? (
                  <span className="text-sm text-yellow-500 ml-2 font-medium">
                    {state.timerPausedRemaining === 0 ? "Stopped" : "Paused"}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Section: Score Control */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Player setup</h2>
              <div className="flex items-center gap-4">
                {saving && <span className="text-sm text-gray-400">Saving...</span>}
                <button 
                  onClick={() => {
                    if(confirm("Are you sure you want to reset all player data (names, characters, points)?")) {
                      updateState({
                        points: { a: 0, b: 0 },
                        players: [
                          { name: "", gamesWon: 0, points: 0, legendName: "", legendCard: null, championName: "", battlefieldName: "", battlefieldCard: null },
                          { name: "", gamesWon: 0, points: 0, legendName: "", legendCard: null, championName: "", battlefieldName: "", battlefieldCard: null }
                        ]
                      });
                      setLegendSearch1("");
                      setLegendSearch2("");
                      setBattlefieldSearch1("");
                      setBattlefieldSearch2("");
                    }
                  }}
                  className="bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs px-3 py-1.5 rounded-md transition-colors font-medium"
                >
                  Reset players data
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Player 1 */}
              <div className="space-y-4 p-4 border border-[var(--border)] rounded-lg">
                <h3 className="font-medium text-lg">Player 1</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Player Name</label>
                    <input 
                      type="text" 
                      value={state?.players?.[0]?.name || ""} 
                      onChange={(e) => updatePlayerName(0, e.target.value)}
                      onBlur={savePlayerNames}
                      placeholder="Player 1" 
                      className="w-full bg-[#111] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" 
                    />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-xs text-gray-400 mb-1">Legend</label>
                    <input 
                      type="text" 
                      value={legendSearch1 || state?.players?.[0]?.legendName || ""} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setLegendSearch1(val);
                        setShowLegendResults1(true);
                        if (val.trim() === "") {
                          const newPlayers = [...state.players];
                          newPlayers[0] = { ...newPlayers[0], legendName: "", legendCard: null };
                          setState({ ...state, players: newPlayers });
                          updateState({ players: newPlayers });
                        }
                      }}
                      onFocus={() => setShowLegendResults1(true)}
                      onBlur={() => {
                        setTimeout(() => setShowLegendResults1(false), 200);
                        updateState({ players: state.players });
                      }}
                      placeholder="Search Legend..." 
                      className="w-full bg-[#111] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" 
                    />
                    {showLegendResults1 && legendResults1.length > 0 && (
                      <div className="absolute z-50 top-full left-0 w-full mt-1 bg-[#111] border border-[#333] rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {legendResults1.map(card => (
                          <div 
                            key={card.id} 
                            className="flex items-center gap-2 p-2 hover:bg-[#222] cursor-pointer"
                            onClick={() => {
                              const newPlayers = [...state.players];
                              newPlayers[0] = { ...newPlayers[0], legendName: card.name, legendCard: card };
                              setState({ ...state, players: newPlayers });
                              updateState({ players: newPlayers });
                              setLegendSearch1("");
                              setShowLegendResults1(false);
                            }}
                          >
                            {card.imageUrl && <img src={card.imageUrl} alt="" className="w-6 h-8 object-cover rounded" />}
                            <span className="text-sm">{card.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-xs text-gray-400 mb-1">Champion Unit</label>
                    {!state?.players?.[0]?.legendName ? (
                      <input 
                        type="text" 
                        disabled
                        placeholder="Select Legend first" 
                        className="w-full bg-[#111] border border-[#333] rounded-md px-3 py-2 text-sm text-gray-500 cursor-not-allowed" 
                      />
                    ) : (
                      <>
                        <input 
                          type="text" 
                          value={championSearch1 || state?.players?.[0]?.championName || ""} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setChampionSearch1(val);
                            setShowChampionResults1(true);
                            if (val.trim() === "") {
                              const newPlayers = [...state.players];
                              newPlayers[0] = { ...newPlayers[0], championName: "" };
                              setState({ ...state, players: newPlayers });
                              updateState({ players: newPlayers });
                            }
                          }}
                          onFocus={() => setShowChampionResults1(true)}
                          onBlur={() => {
                            setTimeout(() => setShowChampionResults1(false), 200);
                            updateState({ players: state.players });
                          }}
                          placeholder={`Search ${legendBase1} units...`} 
                          className="w-full bg-[#111] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" 
                        />
                        {showChampionResults1 && championResults1.length > 0 && (
                          <div className="absolute z-50 top-full left-0 w-full mt-1 bg-[#111] border border-[#333] rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {championResults1.filter(c => !championSearch1 || c.name.toLowerCase().includes(championSearch1.toLowerCase())).map(card => (
                              <div 
                                key={card.id} 
                                className="flex items-center gap-2 p-2 hover:bg-[#222] cursor-pointer"
                                onClick={() => {
                                  const newPlayers = [...state.players];
                                  newPlayers[0] = { ...newPlayers[0], championName: card.name };
                                  setState({ ...state, players: newPlayers });
                                  updateState({ players: newPlayers });
                                  setChampionSearch1("");
                                  setShowChampionResults1(false);
                                }}
                              >
                                {card.imageUrl && <img src={card.imageUrl} alt="" className="w-6 h-8 object-cover rounded" />}
                                <span className="text-sm">{card.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-xs text-gray-400 mb-1">Battlefield</label>
                    <input 
                      type="text" 
                      value={battlefieldSearch1 || state?.players?.[0]?.battlefieldName || ""} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setBattlefieldSearch1(val);
                        setShowBattlefieldResults1(true);
                        if (val.trim() === "") {
                          const newPlayers = [...state.players];
                          newPlayers[0] = { ...newPlayers[0], battlefieldName: "", battlefieldCard: null };
                          setState({ ...state, players: newPlayers });
                          updateState({ players: newPlayers });
                        }
                      }}
                      onFocus={() => setShowBattlefieldResults1(true)}
                      onBlur={() => {
                        setTimeout(() => setShowBattlefieldResults1(false), 200);
                        updateState({ players: state.players });
                      }}
                      placeholder="Search Battlefield..." 
                      className="w-full bg-[#111] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" 
                    />
                    {showBattlefieldResults1 && battlefieldResults1.length > 0 && (
                      <div className="absolute z-50 top-full left-0 w-full mt-1 bg-[#111] border border-[#333] rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {battlefieldResults1.map(card => (
                          <div 
                            key={card.id} 
                            className="flex items-center gap-2 p-2 hover:bg-[#222] cursor-pointer"
                            onClick={() => {
                              const newPlayers = [...state.players];
                              newPlayers[0] = { ...newPlayers[0], battlefieldName: card.name, battlefieldCard: card };
                              setState({ ...state, players: newPlayers });
                              updateState({ players: newPlayers });
                              setBattlefieldSearch1("");
                              setShowBattlefieldResults1(false);
                            }}
                          >
                            {card.imageUrl && <img src={card.imageUrl} alt="" className="w-6 h-8 object-cover rounded" />}
                            <span className="text-sm">{card.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Points</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updatePoints('a', -1)} className="bg-[#222] hover:bg-[#333] w-8 h-8 rounded-md flex items-center justify-center font-bold transition-colors">-</button>
                      <span className="w-8 text-center font-mono">{state?.points?.a || 0}</span>
                      <button onClick={() => updatePoints('a', 1)} className="bg-[#222] hover:bg-[#333] w-8 h-8 rounded-md flex items-center justify-center font-bold transition-colors">+</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Match Points</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        const newPlayers = [...state.players];
                        newPlayers[0] = { ...newPlayers[0], gamesWon: Math.max(0, (newPlayers[0].gamesWon || 0) - 1) };
                        updateState({ players: newPlayers });
                      }} className="bg-[#222] hover:bg-[#333] w-8 h-8 rounded-md flex items-center justify-center font-bold transition-colors">-</button>
                      <span className="w-8 text-center font-mono">{state?.players?.[0]?.gamesWon || 0}</span>
                      <button onClick={() => {
                        const newPlayers = [...state.players];
                        newPlayers[0] = { ...newPlayers[0], gamesWon: (newPlayers[0].gamesWon || 0) + 1 };
                        updateState({ players: newPlayers });
                      }} className="bg-[#222] hover:bg-[#333] w-8 h-8 rounded-md flex items-center justify-center font-bold transition-colors">+</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Player 2 */}
              <div className="space-y-4 p-4 border border-[var(--border)] rounded-lg">
                <h3 className="font-medium text-lg">Player 2</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Player Name</label>
                    <input 
                      type="text" 
                      value={state?.players?.[1]?.name || ""} 
                      onChange={(e) => updatePlayerName(1, e.target.value)}
                      onBlur={savePlayerNames}
                      placeholder="Player 2" 
                      className="w-full bg-[#111] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" 
                    />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-xs text-gray-400 mb-1">Legend</label>
                    <input 
                      type="text" 
                      value={legendSearch2 || state?.players?.[1]?.legendName || ""} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setLegendSearch2(val);
                        setShowLegendResults2(true);
                        if (val.trim() === "") {
                          const newPlayers = [...state.players];
                          newPlayers[1] = { ...newPlayers[1], legendName: "", legendCard: null };
                          setState({ ...state, players: newPlayers });
                          updateState({ players: newPlayers });
                        }
                      }}
                      onFocus={() => setShowLegendResults2(true)}
                      onBlur={() => {
                        setTimeout(() => setShowLegendResults2(false), 200);
                        updateState({ players: state.players });
                      }}
                      placeholder="Search Legend..." 
                      className="w-full bg-[#111] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" 
                    />
                    {showLegendResults2 && legendResults2.length > 0 && (
                      <div className="absolute z-50 top-full left-0 w-full mt-1 bg-[#111] border border-[#333] rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {legendResults2.map(card => (
                          <div 
                            key={card.id} 
                            className="flex items-center gap-2 p-2 hover:bg-[#222] cursor-pointer"
                            onClick={() => {
                              const newPlayers = [...state.players];
                              newPlayers[1] = { ...newPlayers[1], legendName: card.name, legendCard: card };
                              setState({ ...state, players: newPlayers });
                              updateState({ players: newPlayers });
                              setLegendSearch2("");
                              setShowLegendResults2(false);
                            }}
                          >
                            {card.imageUrl && <img src={card.imageUrl} alt="" className="w-6 h-8 object-cover rounded" />}
                            <span className="text-sm">{card.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-xs text-gray-400 mb-1">Champion Unit</label>
                    {!state?.players?.[1]?.legendName ? (
                      <input 
                        type="text" 
                        disabled
                        placeholder="Select Legend first" 
                        className="w-full bg-[#111] border border-[#333] rounded-md px-3 py-2 text-sm text-gray-500 cursor-not-allowed" 
                      />
                    ) : (
                      <>
                        <input 
                          type="text" 
                          value={championSearch2 || state?.players?.[1]?.championName || ""} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setChampionSearch2(val);
                            setShowChampionResults2(true);
                            if (val.trim() === "") {
                              const newPlayers = [...state.players];
                              newPlayers[1] = { ...newPlayers[1], championName: "" };
                              setState({ ...state, players: newPlayers });
                              updateState({ players: newPlayers });
                            }
                          }}
                          onFocus={() => setShowChampionResults2(true)}
                          onBlur={() => {
                            setTimeout(() => setShowChampionResults2(false), 200);
                            updateState({ players: state.players });
                          }}
                          placeholder={`Search ${legendBase2} units...`} 
                          className="w-full bg-[#111] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" 
                        />
                        {showChampionResults2 && championResults2.length > 0 && (
                          <div className="absolute z-50 top-full left-0 w-full mt-1 bg-[#111] border border-[#333] rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {championResults2.filter(c => !championSearch2 || c.name.toLowerCase().includes(championSearch2.toLowerCase())).map(card => (
                              <div 
                                key={card.id} 
                                className="flex items-center gap-2 p-2 hover:bg-[#222] cursor-pointer"
                                onClick={() => {
                                  const newPlayers = [...state.players];
                                  newPlayers[1] = { ...newPlayers[1], championName: card.name };
                                  setState({ ...state, players: newPlayers });
                                  updateState({ players: newPlayers });
                                  setChampionSearch2("");
                                  setShowChampionResults2(false);
                                }}
                              >
                                {card.imageUrl && <img src={card.imageUrl} alt="" className="w-6 h-8 object-cover rounded" />}
                                <span className="text-sm">{card.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-xs text-gray-400 mb-1">Battlefield</label>
                    <input 
                      type="text" 
                      value={battlefieldSearch2 || state?.players?.[1]?.battlefieldName || ""} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setBattlefieldSearch2(val);
                        setShowBattlefieldResults2(true);
                        if (val.trim() === "") {
                          const newPlayers = [...state.players];
                          newPlayers[1] = { ...newPlayers[1], battlefieldName: "", battlefieldCard: null };
                          setState({ ...state, players: newPlayers });
                          updateState({ players: newPlayers });
                        }
                      }}
                      onFocus={() => setShowBattlefieldResults2(true)}
                      onBlur={() => {
                        setTimeout(() => setShowBattlefieldResults2(false), 200);
                        updateState({ players: state.players });
                      }}
                      placeholder="Search Battlefield..." 
                      className="w-full bg-[#111] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" 
                    />
                    {showBattlefieldResults2 && battlefieldResults2.length > 0 && (
                      <div className="absolute z-50 top-full left-0 w-full mt-1 bg-[#111] border border-[#333] rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {battlefieldResults2.map(card => (
                          <div 
                            key={card.id} 
                            className="flex items-center gap-2 p-2 hover:bg-[#222] cursor-pointer"
                            onClick={() => {
                              const newPlayers = [...state.players];
                              newPlayers[1] = { ...newPlayers[1], battlefieldName: card.name, battlefieldCard: card };
                              setState({ ...state, players: newPlayers });
                              updateState({ players: newPlayers });
                              setBattlefieldSearch2("");
                              setShowBattlefieldResults2(false);
                            }}
                          >
                            {card.imageUrl && <img src={card.imageUrl} alt="" className="w-6 h-8 object-cover rounded" />}
                            <span className="text-sm">{card.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Points</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updatePoints('b', -1)} className="bg-[#222] hover:bg-[#333] w-8 h-8 rounded-md flex items-center justify-center font-bold transition-colors">-</button>
                      <span className="w-8 text-center font-mono">{state?.points?.b || 0}</span>
                      <button onClick={() => updatePoints('b', 1)} className="bg-[#222] hover:bg-[#333] w-8 h-8 rounded-md flex items-center justify-center font-bold transition-colors">+</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Match Points</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        const newPlayers = [...state.players];
                        newPlayers[1] = { ...newPlayers[1], gamesWon: Math.max(0, (newPlayers[1].gamesWon || 0) - 1) };
                        updateState({ players: newPlayers });
                      }} className="bg-[#222] hover:bg-[#333] w-8 h-8 rounded-md flex items-center justify-center font-bold transition-colors">-</button>
                      <span className="w-8 text-center font-mono">{state?.players?.[1]?.gamesWon || 0}</span>
                      <button onClick={() => {
                        const newPlayers = [...state.players];
                        newPlayers[1] = { ...newPlayers[1], gamesWon: (newPlayers[1].gamesWon || 0) + 1 };
                        updateState({ players: newPlayers });
                      }} className="bg-[#222] hover:bg-[#333] w-8 h-8 rounded-md flex items-center justify-center font-bold transition-colors">+</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Datalists for Autocomplete */}
              <datalist id="legend-list">
                <option value="Arthur" />
                <option value="Merlin" />
                <option value="Lancelot" />
              </datalist>
              <datalist id="champion-list">
                <option value="Warrior" />
                <option value="Mage" />
                <option value="Archer" />
              </datalist>
              <datalist id="battlefield-list">
                <option value="Forest" />
                <option value="Castle" />
                <option value="Desert" />
              </datalist>
            </div>
          </div>

          {/* Section: Card Setup */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Card setup</h2>
            
            <div className="flex flex-col gap-4 bg-[#111] p-4 rounded-lg border border-[var(--border)] mb-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-300">Show Card on Overlay</label>
                <button
                  onClick={() => {
                    const newCards = { ...state?.cards, showRight: !state?.cards?.showRight };
                    setState({ ...state, cards: newCards });
                    updateState({ cards: newCards });
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${state?.cards?.showRight ? 'bg-[var(--primary)]' : 'bg-gray-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${state?.cards?.showRight ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#333]">
                <label className="text-sm text-gray-300">เวลาการแสดงการ์ด (วินาที)</label>
                <input 
                  type="number" 
                  value={state?.cards?.displaySeconds ?? 10}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setState({ ...state, cards: { ...state?.cards, displaySeconds: val } });
                  }}
                  onBlur={() => updateState({ cards: state.cards })}
                  className="w-20 bg-[#222] border border-[#444] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[var(--primary)] text-center text-white" 
                />
                
                <button 
                  onClick={() => {
                    const newCards = { ...state?.cards, holdCard: !state?.cards?.holdCard };
                    setState({ ...state, cards: newCards });
                    updateState({ cards: newCards });
                  }}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ml-auto sm:ml-0 ${state?.cards?.holdCard ? 'bg-blue-600 text-white' : 'bg-[#222] border border-[#444] text-gray-300 hover:bg-[#333]'}`}
                >
                  Hold
                </button>
                <button 
                  onClick={() => {
                    const newCards = { ...state?.cards, cardVisible: false, holdCard: false };
                    setState({ ...state, cards: newCards });
                    updateState({ cards: newCards });
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Stop
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-[var(--border)] mb-6">
              <button 
                onClick={() => setCardSetupTab('manual')}
                className={`pb-2 text-sm font-medium transition-colors ${cardSetupTab === 'manual' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' : 'text-gray-400 hover:text-gray-300'}`}
              >
                ค้นหาเอง (Manual)
              </button>
              <button 
                onClick={() => setCardSetupTab('import')}
                className={`pb-2 text-sm font-medium transition-colors ${cardSetupTab === 'import' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' : 'text-gray-400 hover:text-gray-300'}`}
              >
                Import Player Deck List
              </button>
            </div>

            {/* Manual Search Tab */}
            {cardSetupTab === 'manual' && (
              <div className="space-y-6">

                <div>
                  <input 
                    type="text" 
                    value={cardSearch}
                    onChange={(e) => setCardSearch(e.target.value)}
                    placeholder="Search by card name or code..." 
                    className="w-full bg-[#111] border border-[#333] rounded-md px-4 py-2 text-sm outline-none focus:border-[var(--primary)] text-white mb-4"
                  />
                  
                  {cardSearchResults.length > 0 && (
                    <div className="bg-[#111] border border-[#333] rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
                      {cardSearchResults.map((card) => (
                        <div 
                          key={card.id}
                          className="flex items-center gap-4 p-3 hover:bg-[#222] cursor-pointer border-b border-[#333] last:border-0 transition-colors"
                          onClick={() => {
                            const newCards = { 
                              ...state?.cards, 
                              rightCard: card,
                              showRight: true,
                              cardVisible: true,
                              holdCard: state?.cards?.holdCard || false,
                              cardShowTimestamp: Date.now()
                            };
                            setState({ ...state, cards: newCards });
                            updateState({ cards: newCards });
                          }}
                        >
                          {card.imageUrl ? (
                            <img src={card.imageUrl} alt={card.name} className="w-10 h-14 object-cover rounded shadow-sm" />
                          ) : (
                            <div className="w-10 h-14 bg-gray-800 rounded flex items-center justify-center text-[10px] text-gray-500 text-center shadow-sm">No Img</div>
                          )}
                          <div>
                            <div className="font-bold text-sm text-white">{card.name}</div>
                            <div className="text-xs text-gray-400">{card.code} • {card.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {cardSearch.trim() && cardSearchResults.length === 0 && (
                    <div className="text-sm text-gray-500 py-4 text-center bg-[#111] border border-[#333] rounded-md">
                      No cards found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Import Deck List Tab */}
            {cardSetupTab === 'import' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* P1 Column */}
                <div className="bg-[#111] border border-[#333] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4 border-b border-[#333] pb-2">
                    <h3 className="font-bold text-[var(--primary)]">Player 1 Deck</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setImportModalPlayer('p1')}
                        className="bg-[#222] hover:bg-[#333] border border-[#444] text-xs px-3 py-1 rounded transition-colors"
                      >
                        Import
                      </button>
                      <button 
                        onClick={() => setP1Deck([])}
                        className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-900/50 text-xs px-3 py-1 rounded transition-colors"
                      >
                        ล้างค่า
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto">
                    {p1Deck.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-8">No cards imported yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {p1Deck.map((card, idx) => (
                          <div 
                            key={`p1-${card.id}-${idx}`}
                            className="flex items-center gap-3 p-2 hover:bg-[#222] cursor-pointer rounded border border-transparent hover:border-[#333] transition-colors"
                            onClick={() => {
                              const newCards = { 
                                ...state?.cards, 
                                rightCard: card,
                                showRight: true,
                                cardVisible: true,
                                holdCard: state?.cards?.holdCard || false,
                                cardShowTimestamp: Date.now()
                              };
                              setState({ ...state, cards: newCards });
                              updateState({ cards: newCards });
                            }}
                          >
                            {card.imageUrl ? (
                              <img src={card.imageUrl} alt={card.name} className="w-8 h-12 object-cover rounded shadow-sm shrink-0" />
                            ) : (
                              <div className="w-8 h-12 bg-gray-800 rounded flex items-center justify-center text-[8px] text-gray-500 text-center shadow-sm shrink-0">No Img</div>
                            )}
                            <div className="min-w-0">
                              <div className="font-medium text-sm text-white truncate">{card.name}</div>
                              <div className="text-xs text-gray-400 truncate">{card.code}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* P2 Column */}
                <div className="bg-[#111] border border-[#333] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4 border-b border-[#333] pb-2">
                    <h3 className="font-bold text-[var(--primary)]">Player 2 Deck</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setImportModalPlayer('p2')}
                        className="bg-[#222] hover:bg-[#333] border border-[#444] text-xs px-3 py-1 rounded transition-colors"
                      >
                        Import
                      </button>
                      <button 
                        onClick={() => setP2Deck([])}
                        className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-900/50 text-xs px-3 py-1 rounded transition-colors"
                      >
                        ล้างค่า
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto">
                    {p2Deck.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-8">No cards imported yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {p2Deck.map((card, idx) => (
                          <div 
                            key={`p2-${card.id}-${idx}`}
                            className="flex items-center gap-3 p-2 hover:bg-[#222] cursor-pointer rounded border border-transparent hover:border-[#333] transition-colors"
                            onClick={() => {
                              const newCards = { 
                                ...state?.cards, 
                                rightCard: card,
                                showRight: true,
                                cardVisible: true,
                                holdCard: state?.cards?.holdCard || false,
                                cardShowTimestamp: Date.now()
                              };
                              setState({ ...state, cards: newCards });
                              updateState({ cards: newCards });
                            }}
                          >
                            {card.imageUrl ? (
                              <img src={card.imageUrl} alt={card.name} className="w-8 h-12 object-cover rounded shadow-sm shrink-0" />
                            ) : (
                              <div className="w-8 h-12 bg-gray-800 rounded flex items-center justify-center text-[8px] text-gray-500 text-center shadow-sm shrink-0">No Img</div>
                            )}
                            <div className="min-w-0">
                              <div className="font-medium text-sm text-white truncate">{card.name}</div>
                              <div className="text-xs text-gray-400 truncate">{card.code}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      
      {/* Import Modal */}
      {importModalPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#111] border border-[#333] rounded-xl w-full max-w-lg p-6 shadow-2xl relative">
            <h2 className="text-xl font-bold mb-4 text-white">Import {importModalPlayer === 'p1' ? 'Player 1' : 'Player 2'} Deck</h2>
            
            <textarea 
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Example:\nLegend:\n1 Master Yi, Wuju Bladesman\n\nChampion:\n1 Master Yi, Tempered\n...`}
              className="w-full h-64 bg-[#0a0a0a] border border-[#333] rounded-md p-3 text-sm text-gray-300 font-mono outline-none focus:border-[var(--primary)] resize-none mb-4"
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setImportModalPlayer(null);
                  setImportText("");
                }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                disabled={isImporting}
              >
                Cancel
              </button>
              <button 
                onClick={handleImportDeck}
                disabled={isImporting || !importText.trim()}
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Importing...
                  </>
                ) : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

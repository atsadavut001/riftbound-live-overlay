"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const MultiSelect = ({ label, options, selected, onChange }: { label: string, options: {label: string, value: string}[], selected: string[], onChange: (v: string[]) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
          {selected.length === 0 ? 'All' : selected.map(v => options.find(o => o.value === v)?.label || v).join(', ')}
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

function DeckBuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("id");
  const [activeTab, setActiveTab] = useState("Legend");
  const [searchTerm, setSearchTerm] = useState("");

  
  

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportText, setExportText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");

    const handleClear = () => {
    if (confirm('Are you sure you want to clear the entire deck?')) {
      setDeck({
        legend: null as any,
        champion: null as any,
        mainDeck: [] as any[],
        battlefields: [] as any[],
        runes: [] as any[],
        sideboard: [] as any[],
        bench: [] as any[]
      });
    }
  };

  const handleExport = () => {
    let result = '';
    if (deck.legend) result += `Legend:\n1 ${deck.legend.name}\n\n`;
    if (deck.champion) result += `Champion:\n1 ${deck.champion.name}\n\n`;

    const addSection = (title: string, cards: any[]) => {
      if (cards.length === 0) return;
      result += `${title}:\n`;
      const counts: Record<string, number> = {};
      cards.forEach(c => {
        counts[c.name] = (counts[c.name] || 0) + 1;
      });
      Object.entries(counts).forEach(([name, count]) => {
        result += `${count} ${name}\n`;
      });
      result += '\n';
    };

        let mainDeckToExport = [...deck.mainDeck];
    if (deck.champion) {
      const champIndex = mainDeckToExport.findIndex(c => c.name === deck.champion.name);
      if (champIndex > -1) mainDeckToExport.splice(champIndex, 1);
    }
    addSection('MainDeck', mainDeckToExport);
    addSection('Battlefields', deck.battlefields);
    addSection('Runes', deck.runes);
    addSection('Sideboard', deck.sideboard);

    setExportText(result.trim());
    setShowExportModal(true);
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    const lines = importText.split('\n').map(l => l.trim()).filter(l => l);
    const parsedData: Record<string, {name: string, count: number}[]> = {
      Legend: [], Champion: [], MainDeck: [], Battlefields: [], Runes: [], Sideboard: []
    };
    
    let currentSection = '';
    const allNames = new Set<string>();
    lines.forEach(line => {
      if (line.endsWith(':')) {
        currentSection = line.slice(0, -1);
      } else {
        const match = line.match(/^(\d+)\s+(.+)$/);
        if (match && currentSection && parsedData[currentSection]) {
          const count = parseInt(match[1]);
          const name = match[2];
          parsedData[currentSection].push({ name, count });
          allNames.add(name);
        }
      }
    });

    if (allNames.size === 0) {
      alert("No valid cards found to import.");
      return;
    }

    try {
      const res = await fetch('/api/cards/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names: Array.from(allNames) })
      });
      const data = await res.json();
      const cardsDict: Record<string, any> = {};
      data.data.forEach((c: any) => {
        cardsDict[c.name] = c;
      });

      const newDeck = {
        legend: null as any, champion: null as any, mainDeck: [] as any[],
        battlefields: [] as any[], runes: [] as any[], sideboard: [] as any[], bench: [] as any[]
      };

      const processSection = (sectionName: string, targetArray: any[]) => {
        parsedData[sectionName].forEach(({name, count}) => {
          const card = cardsDict[name];
          if (card) {
            for(let i=0; i<count; i++) targetArray.push(card);
          }
        });
      };

      if (parsedData.Legend.length > 0 && cardsDict[parsedData.Legend[0].name]) {
        newDeck.legend = cardsDict[parsedData.Legend[0].name];
      }
      if (parsedData.Champion.length > 0 && cardsDict[parsedData.Champion[0].name]) {
        const champCard = cardsDict[parsedData.Champion[0].name];
        newDeck.champion = champCard;
        for(let i = 0; i < parsedData.Champion[0].count; i++) {
          newDeck.mainDeck.push(champCard);
        }
      }

      processSection('MainDeck', newDeck.mainDeck);
      processSection('Battlefields', newDeck.battlefields);
      processSection('Runes', newDeck.runes);
      processSection('Sideboard', newDeck.sideboard);

      setDeck(newDeck);
      setShowImportModal(false);
      setImportText("");
      alert("Deck imported successfully!");
    } catch(e) {
      alert("Failed to import deck.");
    }
  };


  const libraryTabs = ["All", "Legend", "Main Deck", "Battlefields", "Runes"];

  const [cards, setCards] = useState<any[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSet, setSelectedSet] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string[]>([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [previewCard, setPreviewCard] = useState<any>(null);


  useEffect(() => {
    if (editId) {
      fetch(`/api/decks/${editId}`)
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setDeck({
              legend: data.data.cards?.legend || null,
              champion: data.data.cards?.champion || null,
              battlefields: data.data.cards?.battlefields || [],
              runes: data.data.cards?.runes || [],
              mainDeck: data.data.cards?.mainDeck || [],
              sideboard: data.data.cards?.sideboard || [],
              bench: []
            });
            setSaveName(data.data.name || "");
            setSaveDetail(data.data.detail || "");
            setSaveVisibility(data.data.visibility || "Draft");
          }
        });
    }
  }, [editId]);

  const [deck, setDeck] = useState({
    legend: null as any,
    champion: null as any,
    battlefields: [] as any[],
    runes: [] as any[],
    mainDeck: [] as any[],
    sideboard: [] as any[],
    bench: [] as any[]
  });

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDetail, setSaveDetail] = useState("");
  const [saveVisibility, setSaveVisibility] = useState<"Draft" | "Private" | "Public">("Draft");
  const [isSaving, setIsSaving] = useState(false);

  const isDeckValid = deck.legend && deck.champion && deck.battlefields.length === 3 && deck.runes.length === 12 && deck.mainDeck.length >= 40 && deck.sideboard.length <= 10;

  useEffect(() => {
    if (!isDeckValid && saveVisibility !== "Draft") {
      setSaveVisibility("Draft");
    }
  }, [isDeckValid, saveVisibility]);

  

  const handleSaveDeck = async () => {
    if (!saveName.trim()) {
      alert("Please enter a deck name");
      return;
    }
    
    setIsSaving(true);
    try {
      const payload = {
        name: saveName,
        detail: saveDetail,
        visibility: saveVisibility,
        coverImageUrl: deck.legend ? deck.legend.imageUrl : null,
        cards: {
          legend: deck.legend,
          champion: deck.champion,
          battlefields: deck.battlefields,
          runes: deck.runes,
          mainDeck: deck.mainDeck,
          sideboard: deck.sideboard
        }
      };

      let url = '/api/decks';
      let method = 'POST';
      
      if (editId) {
        url = `/api/decks/${editId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Deck ${editId ? 'updated' : 'saved'} successfully!`);
        setShowSaveModal(false);
        router.push(`/decks/${data.data.id}`);
      } else {
        const err = await res.json();
        alert("Failed to save deck: " + err.error);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };


  const [championOptions, setChampionOptions] = useState<any[]>([]);

  useEffect(() => {
    if (deck.legend) {
      const tags = deck.legend.detail?.Tag || [];
      if (tags.length > 0) {
        // Filter from main deck instead of fetching
        const matches = deck.mainDeck.filter((c: any) => {
          if (c.type !== 'Unit') return false;
          const unitTags = c.detail?.Tag || [];
          return tags.some((t: string) => unitTags.includes(t));
        });
        
        // Deduplicate matches by name to avoid showing 3 identical options
        const uniqueMatches = Array.from(new Map(matches.map((c: any) => [c.name, c])).values());
        
        setChampionOptions(uniqueMatches as any[]);
        
        // Validate if current champion is still valid (exists in main deck), if not, clear it
        setDeck(prev => {
          if (prev.champion && !uniqueMatches.some((m: any) => m.name === prev.champion.name)) {
            return { ...prev, champion: null };
          }
          return prev;
        });
      } else {
        setChampionOptions([]);
        setDeck(prev => ({ ...prev, champion: null }));
      }
    } else {
      setChampionOptions([]);
      setDeck(prev => ({ ...prev, champion: null }));
    }
  }, [deck.legend, deck.mainDeck]);

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

const handleAddCard = (card: any, isSideboard: boolean = false) => {
    if (card.type === 'Legend') {
      setDeck(prev => ({ ...prev, legend: card }));
      return;
    }
    
    const getCombinedCount = (prev: any) => {
      const mainCount = prev.mainDeck.filter((c: any) => c.name === card.name).length;
      const sbCount = prev.sideboard.filter((c: any) => c.name === card.name).length;
      return mainCount + sbCount;
    };

    if (isSideboard) {
      setDeck(prev => {
        if (prev.sideboard.length >= 10) return prev;
        if (getCombinedCount(prev) >= 3) return prev;
        return { ...prev, sideboard: [...prev.sideboard, card] };
      });
      return;
    }

    if (card.type === 'Battlefield') {
      setDeck(prev => {
        if (prev.battlefields.length >= 3) return prev;
        if (prev.battlefields.some((b) => b.id === card.id)) return prev;
        return { ...prev, battlefields: [...prev.battlefields, card] };
      });
    } else if (card.type === 'Rune') {
      setDeck(prev => {
        if (prev.runes.length >= 12) return prev;
        return { ...prev, runes: [...prev.runes, card] };
      });
    } else {
      setDeck(prev => {
        if (getCombinedCount(prev) >= 3) return prev;
        return { ...prev, mainDeck: [...prev.mainDeck, card] };
      });
    }
  };

  const handleRemoveCard = (zone: string, id: string, index: number = -1) => {
    if (zone === 'Legend') {
      setDeck(prev => ({ ...prev, legend: null }));
    } else if (zone === 'Main') {
      setDeck(prev => {
        const arr = [...prev.mainDeck];
        arr.splice(index, 1);
        return { ...prev, mainDeck: arr };
      });
    } else if (zone === 'Battlefield') {
      setDeck(prev => {
        const arr = [...prev.battlefields];
        arr.splice(index, 1);
        return { ...prev, battlefields: arr };
      });
    } else if (zone === 'Rune') {
      setDeck(prev => {
        const arr = [...prev.runes];
        arr.splice(index, 1);
        return { ...prev, runes: arr };
      });
    } else if (zone === 'Sideboard') {
      setDeck(prev => {
        const arr = [...prev.sideboard];
        arr.splice(index, 1);
        return { ...prev, sideboard: arr };
      });
    }
  };
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    // Reset page and cards when filters change
    setPage(1);
    setCards([]);
    setHasMore(true);
  }, [activeTab, selectedSet, selectedColor, selectedType, selectedRarity, debouncedSearchTerm, deck.legend]);

  useEffect(() => {
    const fetchCards = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      
      try {
        const setQuery = selectedSet.length > 0 ? selectedSet.join(",") : "";
        let typeQuery = "";
        if (activeTab === "Legend") typeQuery = "Legend";
        else if (activeTab === "Battlefields") typeQuery = "Battlefield";
        else if (activeTab === "Runes") typeQuery = "Rune";
        else if (activeTab === "Main Deck") {
          const validTypes = selectedType.filter(t => ["Unit", "Gear", "Spell"].includes(t));
          typeQuery = validTypes.length > 0 ? validTypes.join(",") : "Unit,Gear,Spell";
        } else if (activeTab === "All") {
          typeQuery = selectedType.length > 0 ? selectedType.join(",") : "";
        }
        let effectiveColorQuery = selectedColor.length > 0 ? selectedColor.join(",") : "";
        if (deck.legend && (activeTab === "Main Deck" || activeTab === "Runes")) {
          const legendColors = deck.legend.detail?.Color || [];
          if (legendColors.length > 0) {
            if (selectedColor.length === 0) {
              effectiveColorQuery = legendColors.join(",");
            } else {
              const validColors = selectedColor.filter(c => legendColors.includes(c));
              effectiveColorQuery = validColors.length > 0 ? validColors.join(",") : legendColors.join(",");
            }
          }
        }
        
        const rarityQuery = selectedRarity.length > 0 ? selectedRarity.join(",") : "";
        const res = await fetch(`/api/admin/cards?page=${page}&limit=30&set=${setQuery}&type=${typeQuery}&color=${effectiveColorQuery}&rarity=${rarityQuery}&search=${encodeURIComponent(debouncedSearchTerm)}`);
        if (res.ok) {
          const data = await res.json();
          if (page === 1) {
            setCards(data.data);
          } else {
            setCards(prev => [...prev, ...data.data]);
          }
          setTotalCards(data.total);
          setHasMore(data.data.length === 30);
        }
      } catch (err) {
        console.error("Failed to fetch cards", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    fetchCards();
  }, [page, activeTab, selectedSet, selectedColor, selectedType, selectedRarity, debouncedSearchTerm, deck.legend]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && !loading && !loadingMore && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="fixed top-16 bottom-[53px] left-0 right-0 flex flex-col lg:flex-row bg-[#111] overflow-hidden">
      
      {/* Left Panel - Library */}
      <div className="flex-1 flex flex-col border-r border-[#333] min-w-0 min-h-0">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-[#333] px-4">
          <div className="flex">
            {libraryTabs.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'text-[var(--primary)] border-[var(--primary)]' : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <label className="flex items-center gap-2 cursor-pointer hover:text-white">
              Owned
              <div className="w-8 h-4 bg-[#333] rounded-full relative">
                <div className="w-3 h-3 bg-gray-500 rounded-full absolute left-0.5 top-0.5"></div>
              </div>
            </label>
            <div className="flex items-center gap-2 border-l border-[#333] pl-4">
              <span>Add to:</span>
              <button className="hover:text-white"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></button>
              <button className="hover:text-white"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg></button>
              <button className="hover:text-white"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
              <div className="h-4 w-px bg-[#333] mx-1"></div>
              <button className="hover:text-white"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
              <button className="hover:text-white"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-[#333]">
          <div className="flex flex-col gap-3 mb-3">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by card name or code..." 
                className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm outline-none focus:border-[var(--primary)] text-white"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2">
                {['Fury', 'Calm', 'Mind', 'Order', 'Chaos', 'Body'].map((rune) => (
                  <button 
                    key={rune} 
                    onClick={() => setSelectedColor(prev => prev.includes(rune) ? prev.filter(r => r !== rune) : [...prev, rune])}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center hover:opacity-80 transition-all ${selectedColor.includes(rune) ? 'border-[var(--primary)] bg-[#222]' : 'border-[#444] bg-transparent'}`} 
                    title={rune}
                  >
                    <img src={`/runes/${rune}.webp`} alt={rune} className="w-5 h-5 object-contain" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                  </button>
                ))}
              </div>

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
                onChange={setSelectedSet} 
              />
              
              {(activeTab === "Main Deck" || activeTab === "All") && (
                <>
                  <MultiSelect 
                    label="Type" 
                    options={
                      activeTab === "Main Deck" 
                        ? [
                            {label: "Unit", value: "Unit"},
                            {label: "Gear", value: "Gear"},
                            {label: "Spell", value: "Spell"}
                          ]
                        : [
                            {label: "Legend", value: "Legend"},
                            {label: "Battlefield", value: "Battlefield"},
                            {label: "Unit", value: "Unit"},
                            {label: "Gear", value: "Gear"},
                            {label: "Spell", value: "Spell"},
                            {label: "Rune", value: "Rune"}
                          ]
                    } 
                    selected={selectedType} 
                    onChange={setSelectedType} 
                  />
                  <MultiSelect 
                    label="Rarity" 
                    options={[
                      {label: "Common", value: "Common"},
                      {label: "Uncommon", value: "Uncommon"},
                      {label: "Rare", value: "Rare"},
                      {label: "Epic", value: "Epic"},
                      {label: "Legendary", value: "Legendary"}
                    ]} 
                    selected={selectedRarity} 
                    onChange={setSelectedRarity} 
                  />
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span>Total:</span>
              <span className="text-[var(--primary)] font-medium">{totalCards} cards</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { setSelectedColor([]); setSelectedSet([]); setSelectedType([]); setSelectedRarity([]); setSearchTerm(''); }}
                className="hover:text-white flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Card Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" onScroll={handleScroll}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3">
            {cards.map(card => (
              <div key={card.id} className="aspect-[2/3] relative rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-[var(--primary)] transition-all group">
                <img 
                  src={card.imageUrl} 
                  alt={card.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 200 300"><rect width="200" height="300" fill="%23222"/></svg>' }}
                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity z-20">
                  <button 
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold px-4 py-1.5 rounded shadow-lg transition-colors w-24"
                    onClick={(e) => { e.stopPropagation(); handleAddCard(card, false); }}
                  >ADD</button>
                  {!['Legend', 'Battlefield', 'Rune', 'Champion'].includes(card.type) && (
                    <button 
                      className="bg-[#444] hover:bg-[#666] text-white text-xs font-bold px-4 py-1.5 rounded shadow-lg transition-colors w-24"
                      onClick={(e) => { e.stopPropagation(); handleAddCard(card, true); }}
                    >SIDEBOARD</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {loadingMore && <div className="text-center py-4 text-gray-500 text-sm">Loading more...</div>}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col bg-[#0a0a0a]">

        {/* Deck Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          
          {/* Top Row: Legend, Champion, Runes */}
          <div className="flex flex-col xl:flex-row gap-4 mb-6">
            <div className="flex gap-4">
              <div className="w-[120px] sm:w-[140px] xl:w-[160px] flex-shrink-0 flex flex-col">
                <h3 className="text-sm font-medium mb-2">Legend <span className="text-[var(--primary)]">{deck.legend ? '1/1' : '0/1'}</span></h3>
                {deck.legend ? (
                  <div 
                    className="relative aspect-[2/3] rounded-lg overflow-hidden border border-[var(--primary)] group cursor-pointer flex-1"
                    onClick={() => setPreviewCard(deck.legend)}
                  >
                    <img src={deck.legend.imageUrl} alt={deck.legend.name} className="w-full h-full object-cover" />
                    <button 
                      className="absolute top-1 right-1 bg-black/80 hover:bg-red-600 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-all z-10"
                      onClick={(e) => { e.stopPropagation(); handleRemoveCard('Legend', deck.legend.id); }}
                      title="Remove"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-[#444] rounded-lg aspect-[2/3] flex items-center justify-center text-sm text-gray-500 hover:border-gray-400 hover:bg-[#222] cursor-pointer transition-colors bg-[#111] flex-1">
                    Add
                  </div>
                )}
              </div>
              <div className="w-[120px] sm:w-[140px] xl:w-[160px] flex-shrink-0 flex flex-col">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <span>Champion <span className="text-[var(--primary)]">{deck.champion ? '1/1' : '0/1'}</span></span>
                  {deck.legend && championOptions.length > 0 && (
                    <select 
                      className="bg-[#222] text-xs border border-[#444] rounded px-1 py-0.5 max-w-[80px]"
                      value={deck.champion?.id || ''}
                      onChange={(e) => {
                        const selected = championOptions.find(c => c.id === e.target.value);
                        setDeck(prev => ({ ...prev, champion: selected || null }));
                      }}
                    >
                      <option value="">Select...</option>
                      {championOptions.map(c => (
                        <option key={c.id} value={c.id}>{c.code}</option>
                      ))}
                    </select>
                  )}
                </h3>
                {deck.champion ? (
                  <div 
                    className="relative aspect-[2/3] rounded-lg overflow-hidden border border-[var(--primary)] group cursor-pointer flex-1"
                    onClick={() => setPreviewCard(deck.champion)}
                  >
                    <img src={deck.champion.imageUrl} alt={deck.champion.name} className="w-full h-full object-cover" />
                    <button 
                      className="absolute top-1 right-1 bg-black/80 hover:bg-red-600 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-all z-10"
                      onClick={(e) => { e.stopPropagation(); setDeck(prev => ({ ...prev, champion: null })); }}
                      title="Remove"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-[#444] rounded-lg aspect-[2/3] flex items-center justify-center text-sm text-gray-500 hover:border-gray-400 hover:bg-[#222] cursor-pointer transition-colors bg-[#111] flex-1">
                    Select
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              <h3 className="text-sm font-medium mb-2">Runes <span className="text-[var(--primary)]">{deck.runes.length}/12</span></h3>
              {deck.runes.length === 0 ? (
                <div className="border border-dashed border-[#333] rounded-lg h-full min-h-[120px] flex items-center justify-center text-sm text-gray-600 hover:border-gray-500 hover:bg-[#222] cursor-pointer transition-colors bg-[#111] flex-1">
                  Add runes
                </div>
              ) : (
                <div className="grid grid-cols-6 grid-rows-2 gap-2 h-full flex-1">
                  {deck.runes.map((c, i) => (
                    <div 
                      key={i} 
                      className="relative rounded overflow-hidden border border-[#333] hover:border-[var(--primary)] group cursor-pointer bg-[#111] flex items-center justify-center h-full aspect-[2/3] sm:aspect-auto"
                      onClick={() => setPreviewCard(c)}
                    >
                      <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                      <button 
                        className="absolute top-0.5 right-0.5 bg-black/80 hover:bg-red-600 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-all z-10"
                        onClick={(e) => { e.stopPropagation(); handleRemoveCard('Rune', c.id, i); }}
                        title="Remove"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  ))}
                  {Array.from({ length: 12 - deck.runes.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="border border-dashed border-[#333]/50 rounded bg-[#111]/30 aspect-[2/3] sm:aspect-auto"></div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Battlefields */}

          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Battlefields <span className="text-[var(--primary)]">{deck.battlefields.length}/3</span></h3>
            {deck.battlefields.length === 0 ? (
              <div className="border border-dashed border-[#333] rounded-lg h-24 flex items-center justify-center text-sm text-gray-600 hover:border-gray-500 hover:bg-[#222] cursor-pointer transition-colors bg-[#111]">
                Add battlefields
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {deck.battlefields.map((c, i) => (
                  <div 
                    key={i} 
                    className="relative aspect-[3/2] rounded overflow-hidden border border-[#333] hover:border-[var(--primary)] group cursor-pointer bg-[#111] flex items-center justify-center"
                    onClick={() => setPreviewCard(c)}
                  >
                    <img src={c.imageUrl} alt={c.name} style={{ transform: 'rotate(90deg)', height: '150%', width: 'auto', maxWidth: 'none' }} />
                    <button 
                      className="absolute top-0.5 right-0.5 bg-black/80 hover:bg-red-600 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-all z-10"
                      onClick={(e) => { e.stopPropagation(); handleRemoveCard('Battlefield', c.id, i); }}
                      title="Remove"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* Main Deck */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Main Deck <span className="text-[var(--primary)]">{deck.mainDeck.length}</span></h3>
            {deck.mainDeck.length === 0 ? (
              <div className="border border-dashed border-[#333] rounded-lg h-32 flex items-center justify-center text-sm text-gray-600 hover:border-gray-500 hover:bg-[#222] cursor-pointer transition-colors bg-[#111]">
                Add cards from library
              </div>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {deck.mainDeck.map((c, i) => (
                  <div 
                    key={i} 
                    className="relative aspect-[2/3] rounded overflow-hidden border border-[#333] hover:border-[var(--primary)] group cursor-pointer bg-[#111] flex items-center justify-center"
                    onClick={() => setPreviewCard(c)}
                  >
                    <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                    <button 
                      className="absolute top-0.5 right-0.5 bg-black/80 hover:bg-red-600 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-all z-10"
                      onClick={(e) => { e.stopPropagation(); handleRemoveCard('Main', c.id, i); }}
                      title="Remove"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* The Bench */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Sideboard <span className="text-[var(--primary)]">{deck.sideboard.length}/10</span></h3>
            {deck.sideboard.length === 0 ? (
              <div className="border border-dashed border-[#333] rounded-lg h-24 flex items-center justify-center text-sm text-gray-600 hover:border-gray-500 hover:bg-[#222] cursor-pointer transition-colors bg-[#111]">
                Plan cards here (saved with deck)
              </div>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {deck.sideboard.map((c, i) => (
                  <div 
                    key={i} 
                    className="relative aspect-[2/3] rounded overflow-hidden border border-[#333] hover:border-[var(--primary)] group cursor-pointer bg-[#111] flex items-center justify-center"
                    onClick={() => setPreviewCard(c)}
                  >
                    <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                    <button 
                      className="absolute top-0.5 right-0.5 bg-black/80 hover:bg-red-600 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-all z-10"
                      onClick={(e) => { e.stopPropagation(); handleRemoveCard('Sideboard', c.id, i); }}
                      title="Remove"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#333] bg-[#111] flex justify-between items-center">
          <div className="flex gap-4 text-sm text-gray-300 font-medium">
            <button className="flex items-center gap-2 hover:text-white" onClick={() => setShowImportModal(true)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Import
            </button>
                        <button className="flex items-center gap-2 hover:text-white" onClick={handleClear}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Clear
            </button>
            <button className="flex items-center gap-2 hover:text-white" onClick={handleExport}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export
            </button>
          </div>
          <button className="bg-[var(--primary)] text-white font-bold px-6 py-2 rounded flex items-center gap-2 hover:bg-[var(--primary-hover)] transition-colors" onClick={() => setShowSaveModal(true)}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
            Save Deck
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      
      
      
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-[#333] rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col">
            <h2 className="text-xl font-bold mb-4">Save Deck</h2>
            
            <label className="text-sm text-gray-400 mb-1 block">Deck Name</label>
            <input 
              type="text"
              className="bg-[#1a1a1a] border border-[#333] rounded p-2 text-sm text-gray-200 focus:border-[var(--primary)] outline-none w-full mb-4"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="My Awesome Deck"
            />

            <label className="text-sm text-gray-400 mb-1 block">Description</label>
            <textarea 
              className="bg-[#1a1a1a] border border-[#333] rounded p-2 text-sm text-gray-200 focus:border-[var(--primary)] outline-none w-full mb-4 resize-none min-h-[80px]"
              value={saveDetail}
              onChange={e => setSaveDetail(e.target.value)}
              placeholder="How to play this deck..."
            />

            <label className="text-sm text-gray-400 mb-1 block">Visibility</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="visibility" value="Draft" checked={saveVisibility === "Draft"} onChange={() => setSaveVisibility("Draft")} />
                Draft
              </label>
              <label className={`flex items-center gap-2 text-sm ${!isDeckValid ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input type="radio" name="visibility" value="Private" checked={saveVisibility === "Private"} disabled={!isDeckValid} onChange={() => setSaveVisibility("Private")} />
                Private
              </label>
              <label className={`flex items-center gap-2 text-sm ${!isDeckValid ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input type="radio" name="visibility" value="Public" checked={saveVisibility === "Public"} disabled={!isDeckValid} onChange={() => setSaveVisibility("Public")} />
                Public
              </label>
            </div>
            
            {!isDeckValid && (
              <p className="text-xs text-red-400 mb-4 bg-red-900/20 p-2 rounded">
                Your deck is invalid. It must have 1 Legend, 1 Champion, 3 Battlefields, 12 Runes, at least 40 Main Deck cards, and at most 10 Sideboard cards to be published. It will be saved as Draft.
              </p>
            )}
            
            <div className="flex justify-end gap-3 mt-4">
              <button 
                className="px-4 py-2 rounded text-sm font-bold text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowSaveModal(false)}
                disabled={isSaving}
              >
                CANCEL
              </button>
              <button 
                className="px-4 py-2 rounded text-sm font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
                onClick={handleSaveDeck}
                disabled={isSaving}
              >
                {isSaving ? "SAVING..." : "SAVE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-[#333] rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">Export Deck</h2>
            <p className="text-sm text-gray-400 mb-4">Copy your decklist to share with others</p>
            <textarea 
              className="flex-1 min-h-[200px] bg-[#1a1a1a] border border-[#333] rounded p-3 text-sm text-gray-200 focus:border-[var(--primary)] outline-none resize-none mb-4"
              value={exportText}
              readOnly
            />
            <div className="flex justify-end gap-3">
              <button 
                className="px-4 py-2 rounded text-sm font-bold text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowExportModal(false)}
              >
                CANCEL
              </button>
              <button 
                className="px-4 py-2 rounded text-sm font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(exportText).then(() => {
                    alert("Deck copied to clipboard!");
                    setShowExportModal(false);
                  });
                }}
              >
                COPY
              </button>
            </div>
          </div>
        </div>
      )}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-[#333] rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">Import Deck</h2>
            <p className="text-sm text-gray-400 mb-4">Paste your decklist below (e.g. 3 Stupefy)</p>
            <textarea 
              className="flex-1 min-h-[200px] bg-[#1a1a1a] border border-[#333] rounded p-3 text-sm text-gray-200 focus:border-[var(--primary)] outline-none resize-none mb-4"
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder={"Legend:\n1 Viktor, Herald of the Arcane\n\nMainDeck:\n3 Stupefy"}
            />
            <div className="flex justify-end gap-3">
              <button 
                className="px-4 py-2 rounded text-sm font-bold text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowImportModal(false)}
              >
                CANCEL
              </button>
              <button 
                className="px-4 py-2 rounded text-sm font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
                onClick={handleImport}
              >
                IMPORT
              </button>
            </div>
          </div>
        </div>
      )}

      {previewCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewCard(null)}>
          <div 
            className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-2"
              onClick={() => setPreviewCard(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            {/* Left: Card Image */}
            <div className="w-full md:w-[45%] lg:w-[40%] bg-black p-6 flex items-center justify-center border-r border-[#333]">
              <div className={`relative w-full max-w-sm flex items-center justify-center overflow-hidden ${previewCard.type === 'Battlefield' ? 'aspect-[3/2]' : 'aspect-[2/3]'}`}>
                <img 
                  src={previewCard.imageUrl} 
                  alt={previewCard.code}
                  style={previewCard.type === 'Battlefield' ? { transform: 'rotate(90deg)', height: '150%', width: 'auto', maxWidth: 'none' } : {}}
                  className={`rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] ${previewCard.type === 'Battlefield' ? '' : 'w-full h-full object-contain'}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 200 300"><rect width="200" height="300" fill="%23222"/><text x="100" y="150" fill="%23666" text-anchor="middle" dominant-baseline="middle">Card Missing</text></svg>';
                  }}
                />
              </div>
            </div>

            
            {/* Right: Card Details */}
            <div className="w-full md:w-[55%] lg:w-[60%] p-8 overflow-y-auto max-h-[80vh]">
              <h2 className="text-3xl font-bold mb-4">{previewCard.name}, {previewCard.code}</h2>
              
              {/* Badges Row 1 */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] border border-[#333] rounded-md text-sm font-medium">
                  {previewCard.rarity && (
                    <img 
                      src={`/rarity/${previewCard.rarity.toLowerCase()}.webp`} 
                      alt={previewCard.rarity} 
                      className="w-5 h-5 object-contain"
                      onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                    />
                  )}
                  {previewCard.type}
                </div>
                {previewCard.detail?.Color?.map((c: string, i: number) => (
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
                {previewCard.detail?.Tag?.map((tag: string, i: number) => (
                  <div key={`t-${i}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] border border-[#333] rounded-md text-sm font-medium">
                    {tag}
                  </div>
                ))}
              </div>

              {/* Stats Box */}
              {(previewCard.detail?.Energy || previewCard.detail?.Power || previewCard.detail?.Might) && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="flex flex-col items-center justify-center bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                    <span className="text-gray-400 text-sm mb-1">Energy</span>
                    <span className="text-4xl font-bold">{previewCard.detail?.Energy || '-'}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                    <span className="text-gray-400 text-sm mb-1">Power</span>
                    <span className="text-4xl font-bold">{previewCard.detail?.Power || '-'}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                    <span className="text-gray-400 text-sm mb-1">Might</span>
                    <span className="text-4xl font-bold">{previewCard.detail?.Might || '-'}</span>
                  </div>
                </div>
              )}

              {/* Description */}
              {previewCard.detail?.Ability && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-2">Ability</h3>
                  <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {renderAbilityText(previewCard.detail?.Ability)}
                  </div>
                </div>
              )}

              {/* Flavor Text (Original) - Show only if we don't move it to Equip Section */}
              {previewCard.detail?.["Flavor Text"] && (previewCard.detail?.["Equip Effect"] || previewCard.detail?.["Equip Might"] === undefined) && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-2">Flavor Text</h3>
                  <p className="text-gray-500 italic leading-relaxed whitespace-pre-wrap">
                    {previewCard.detail?.["Flavor Text"]}
                  </p>
                </div>
              )}

              {/* Equip Section (For Gear/Equipment) */}
              {(previewCard.detail?.["Equip Effect"] || previewCard.detail?.["Equip Might"]) && (
                <div className="mt-8 pt-6 border-t border-[#333]">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)]"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/><path d="M14.5 14.5L19.5 9.5"/></svg>
                    Equipment Bonus
                  </h3>
                  
                  {previewCard.detail?.["Equip Might"] && (
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-gray-400">Equip Might:</span>
                      <span className="text-2xl font-bold text-yellow-400">+{previewCard.detail?.["Equip Might"]}</span>
                    </div>
                  )}
                  
                  {previewCard.detail?.["Equip Effect"] && (
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 mb-4">
                      <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {renderAbilityText(previewCard.detail?.["Equip Effect"])}
                      </div>
                    </div>
                  )}

                  {/* Flavor Text moved here for Equipment */}
                  {previewCard.detail?.["Flavor Text"] && (
                    <div className="mt-4">
                      <p className="text-gray-500 italic text-sm leading-relaxed whitespace-pre-wrap">
                        {previewCard.detail?.["Flavor Text"]}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Suspense } from 'react';
export default function DeckBuilderPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading editor...</div>}>
      <DeckBuilderContent />
    </Suspense>
  );
}

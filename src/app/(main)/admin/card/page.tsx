"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function AdminCardPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedSet, setSelectedSet] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Load state from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('adminCardFilters');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.page) setPage(parsed.page);
        if (parsed.limit) setLimit(parsed.limit);
        if (parsed.selectedSet) setSelectedSet(parsed.selectedSet);
        if (parsed.selectedType) setSelectedType(parsed.selectedType);
        if (parsed.selectedRarity) setSelectedRarity(parsed.selectedRarity);
        if (parsed.selectedColor) setSelectedColor(parsed.selectedColor);
        if (parsed.searchTerm !== undefined) {
          setSearchTerm(parsed.searchTerm);
          setDebouncedSearchTerm(parsed.searchTerm);
        }
      }
    } catch (e) {}
    setIsInitialized(true);
  }, []);

  // Save state to sessionStorage when filters change
  useEffect(() => {
    if (!isInitialized) return;
    const stateToSave = {
      page,
      limit,
      selectedSet,
      selectedType,
      selectedRarity,
      selectedColor,
      searchTerm
    };
    sessionStorage.setItem('adminCardFilters', JSON.stringify(stateToSave));
  }, [page, limit, selectedSet, selectedType, selectedRarity, selectedColor, searchTerm, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, isInitialized]);

  // When search changes (debounced), reset to page 1
  useEffect(() => {
    if (!isInitialized) return;
    // We only want to reset page if this is a genuine user search change, not the initial load
    // Actually handled by setting page to 1 on UI interactions, let's keep it simple
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (!isInitialized) return;
    fetchCards();
  }, [page, limit, selectedSet, selectedType, selectedRarity, selectedColor, debouncedSearchTerm, isInitialized]);

  const fetchCards = async () => {
    try {
      const setQuery = selectedSet.length > 0 ? selectedSet.join(",") : "";
      const typeQuery = selectedType.length > 0 ? selectedType.join(",") : "";
      const rarityQuery = selectedRarity.length > 0 ? selectedRarity.join(",") : "";
      const colorQuery = selectedColor.length > 0 ? selectedColor.join(",") : "";

      const res = await fetch(`/api/admin/cards?page=${page}&limit=${limit}&set=${setQuery}&type=${typeQuery}&rarity=${rarityQuery}&color=${colorQuery}&search=${encodeURIComponent(debouncedSearchTerm)}`);
      const data = await res.json();
      if (data.data) {
        setCards(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this card?")) return;
    try {
      await fetch(`/api/admin/cards/${id}`, { method: "DELETE" });
      fetchCards();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[var(--primary)]">Card Management</h1>
        <button 
          onClick={() => router.push("/admin/card/new")} 
          className="bg-[var(--primary)] text-white px-4 py-2 rounded hover:bg-[var(--primary-hover)] transition-colors font-medium"
        >
          + Add New Card
        </button>
      </div>

      {/* Filters Area */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 sm:p-6 mb-6">
        {/* Top Row: Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
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
                  setPage(1); 
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
              onChange={(v) => { setSelectedSet(v); setPage(1); }} 
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
              onChange={(v) => { setSelectedType(v); setPage(1); }} 
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
              onChange={(v) => { setSelectedRarity(v); setPage(1); }} 
            />
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111] text-gray-400 border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-3 font-medium w-16">Image</th>
                <th className="px-6 py-3 font-medium">Code</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Rarity</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {cards.map(card => (
                <tr key={card.id} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-6 py-2">
                    {card.imageUrl ? (
                      <div className="w-10 h-14 relative rounded overflow-hidden border border-[#333]">
                        <img src={card.imageUrl} alt={card.code} className="absolute inset-0 w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                      </div>
                    ) : (
                      <div className="w-10 h-14 bg-gray-800 rounded border border-[#333]" />
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-[var(--primary)]">{card.code}</td>
                  <td className="px-6 py-4 font-bold">{card.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-800 rounded-md text-xs">{card.type}</span>
                  </td>
                  <td className="px-6 py-4">{card.rarity || "-"}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => router.push(`/admin/card/${card.id}`)} className="text-blue-400 hover:text-blue-300">Edit</button>
                    <button onClick={() => handleDelete(card.id)} className="text-red-400 hover:text-red-300">Delete</button>
                  </td>
                </tr>
              ))}
              {cards.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No cards found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <div className="p-4 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#111]">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Show</span>
            <select 
              value={limit} 
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              className="bg-[#222] border border-gray-700 rounded px-2 py-1 outline-none text-white"
            >
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="ml-2">items. Total: <span className="font-bold text-white">{total}</span></span>
          </div>
          <div className="flex gap-2 items-center">
            <button 
              disabled={page <= 1} 
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-[#222] rounded hover:bg-[#333] disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm text-gray-400 px-2">Page {page} of {totalPages}</span>
            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-[#222] rounded hover:bg-[#333] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

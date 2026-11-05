"use client";

import { useEffect, useState, useRef } from "react";
import { SET_OPTIONS } from "@/lib/sets";
import { RARITY_OPTIONS } from "@/lib/rarity";
import ShopItemForm from "@/components/admin/ShopItemForm";

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

export default function AdminShopPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [selectedSet, setSelectedSet] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string[]>([]);
  const [selectedPriceSort, setSelectedPriceSort] = useState<string>("None");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creatingCardId, setCreatingCardId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/admin/shop");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shop item?")) return;
    try {
      const res = await fetch(`/api/admin/shop/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchItems();
      } else {
        alert("Failed to delete item");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredItems = items.filter(item => {
    let match = true;
    
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      const name = (item.card?.name || "").toLowerCase();
      const code = (item.card?.code || "").toLowerCase();
      const print = (item.print || "Normal").toLowerCase();
      if (!name.includes(s) && !code.includes(s) && !print.includes(s)) match = false;
    }

    // Set filter (by code prefix)
    if (match && selectedSet.length > 0) {
      const code = item.card?.code || "";
      const setMatch = selectedSet.some(set => code.startsWith(`${set}-`));
      if (!setMatch) match = false;
    }

    // Type filter
    if (match && selectedType.length > 0) {
      if (!selectedType.includes(item.card?.type)) match = false;
    }

    // Rarity filter
    if (match && selectedRarity.length > 0) {
      if (!selectedRarity.includes(item.card?.rarity)) match = false;
    }

    // Color filter
    if (match && selectedColor.length > 0) {
      const colors = item.card?.detail?.Color || [];
      const colorMatch = selectedColor.some(c => colors.includes(c));
      if (!colorMatch) match = false;
    }

    return match;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (selectedPriceSort === "HighToLow") {
      return Number(b.price) - Number(a.price);
    } else if (selectedPriceSort === "LowToHigh") {
      return Number(a.price) - Number(b.price);
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedItems.length / limit) || 1;
  const paginatedItems = sortedItems.slice((page - 1) * limit, page * limit);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-[var(--primary)]">Shop Management</h1>
          <p className="text-gray-400">Manage Zberus Shop inventory and prices</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setCreatingCardId(null); setCreateOpen(true); }}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 font-medium text-white shadow-lg transition-colors hover:bg-[var(--primary-hover)]"
          >
            + Add Shop Item
          </button>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Search by card name, code, or print..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[#111] border border-[#333] rounded-md pl-4 pr-10 py-2 text-sm outline-none focus:border-[var(--primary)] text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
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
              options={SET_OPTIONS} 
              selected={selectedSet} 
              onChange={(val) => { setSelectedSet(val); setPage(1); }} 
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
              onChange={(val) => { setSelectedType(val); setPage(1); }} 
            />
            <MultiSelect 
              label="Rarity" 
              options={RARITY_OPTIONS} 
              selected={selectedRarity} 
              onChange={(val) => { setSelectedRarity(val); setPage(1); }} 
            />
            
            <div className="relative flex-1 min-w-[120px]">
              <div className="flex items-center gap-2 bg-[#111] border border-[#333] rounded-md px-3 py-1.5 cursor-pointer h-full">
                <span className="text-xs text-gray-500 whitespace-nowrap">Price</span>
                <select 
                  value={selectedPriceSort} 
                  onChange={e => { setSelectedPriceSort(e.target.value); setPage(1); }}
                  className="bg-transparent text-sm text-gray-300 w-full outline-none appearance-none cursor-pointer"
                >
                  <option value="None" className="bg-[#1a1a1a]">None</option>
                  <option value="HighToLow" className="bg-[#1a1a1a]">มากไปน้อย</option>
                  <option value="LowToHigh" className="bg-[#1a1a1a]">น้อยไปมาก</option>
                </select>
                <svg className="w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden flex-1 flex flex-col">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading shop items...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <div className="text-4xl mb-3">🛒</div>
            <p>No items in the shop yet.</p>
            <p className="text-sm mt-1">Click "Add Shop Item" to list a card for sale.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <p>ไม่พบสินค้าที่ค้นหา</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {paginatedItems.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-xl border border-[#333] bg-[#111]">
                <div className="relative aspect-[3/4] bg-[#1a1a1a]">
                  {item.card?.imageUrl ? (
                    <img src={item.card.imageUrl} alt={item.card?.name || "Card"} className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">No Image</div>
                  )}
                  {item.highlight && (
                    <span className="absolute left-2 top-2 rounded border border-yellow-800/50 bg-yellow-900/80 px-2 py-1 text-xs font-bold text-yellow-400">Highlight</span>
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <div className="truncate font-medium text-white">{item.card?.name || "Unknown Card"}</div>
                  <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
                    <span className="truncate">{item.card?.code || "N/A"}</span>
                    <span className="shrink-0 rounded bg-purple-900/40 px-1.5 py-0.5 text-purple-400">{item.print || "Normal"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
                    <span className="truncate">{item.card?.type} · {item.card?.rarity}</span>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 font-bold ${item.quantity > 0 ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                      {item.quantity} คงเหลือ
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#292929] pt-2">
                    <span className="font-bold text-[var(--primary)]">฿{item.price}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingId(item.id)}
                        className="rounded p-2 text-blue-400 transition-colors hover:bg-blue-400/10"
                        title="Edit"
                        aria-label={`Edit ${item.card?.name || "shop item"}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded p-2 text-red-400 transition-colors hover:bg-red-400/10"
                        title="Delete"
                        aria-label={`Delete ${item.card?.name || "shop item"}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && items.length > 0 && filteredItems.length > 0 && (
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
              <span className="ml-2">items. Total: <span className="font-bold text-white">{filteredItems.length}</span></span>
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
        )}
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Add shop item">
          <div className="mx-auto my-4 max-w-2xl">
            <ShopItemForm
              key={`new-${creatingCardId ?? "blank"}`}
              initialCardId={creatingCardId ?? undefined}
              onSaved={() => {
                setCreateOpen(false);
                setCreatingCardId(null);
                fetchItems();
              }}
              onCancel={() => {
                setCreateOpen(false);
                setCreatingCardId(null);
              }}
            />
          </div>
        </div>
      )}

      {editingId && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Edit shop item">
          <div className="mx-auto my-4 max-w-2xl">
            <ShopItemForm
              key={editingId}
              shopItemId={editingId}
              onSaved={() => {
                setEditingId(null);
                fetchItems();
              }}
              onCancel={() => setEditingId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

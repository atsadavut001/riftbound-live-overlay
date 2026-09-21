"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  const router = useRouter();

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
        <Link 
          href="/admin/shop/new" 
          className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg"
        >
          + Add Shop Item
        </Link>
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
              options={[
                {label: "Origins [OGN]", value: "OGN"},
                {label: "Spiritforged [SFD]", value: "SFD"},
                {label: "Unleashed [UNL]", value: "UNL"},
                {label: "Vendetta [VEN]", value: "VEN"},
                {label: "Proving Grounds [OGS]", value: "OGS"},
                {label: "Arcane Box Set [ARC]", value: "ARC"}
              ]} 
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
              options={[
                {label: "Common", value: "Common"},
                {label: "Uncommon", value: "Uncommon"},
                {label: "Rare", value: "Rare"},
                {label: "Epic", value: "Epic"},
                {label: "Showcase", value: "Showcase"}
              ]} 
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1a1a1a] border-b border-[#333]">
                  <th className="p-4 text-sm font-medium text-gray-400">Card Image</th>
                  <th className="p-4 text-sm font-medium text-gray-400">Card Info</th>
                  <th className="p-4 text-sm font-medium text-gray-400">Price (฿)</th>
                  <th className="p-4 text-sm font-medium text-gray-400">Quantity</th>
                  <th className="p-4 text-sm font-medium text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1a1a1a] transition-colors group">
                    <td className="p-4 w-24">
                      {item.card?.imageUrl ? (
                        <img src={item.card.imageUrl} alt="Card" className="w-12 h-16 object-contain rounded border border-[#333]" />
                      ) : (
                        <div className="w-12 h-16 bg-[#222] rounded border border-[#333] flex items-center justify-center text-xs text-gray-500">No Img</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-lg mb-1">{item.card?.name || 'Unknown Card'}</div>
                      <div className="flex gap-2 text-sm text-gray-400 mt-1">
                        <span className="bg-[#222] px-2 py-0.5 rounded">{item.card?.code || 'N/A'}</span>
                        <span className="bg-purple-900/40 text-purple-400 px-2 py-0.5 rounded border border-purple-800/50">{item.print || 'Normal'}</span>
                        <span>{item.card?.type}</span>
                        <span>{item.card?.rarity}</span>
                        {item.highlight && (
                          <span className="bg-yellow-900/40 text-yellow-400 px-2 py-0.5 rounded font-bold border border-yellow-800/50">Highlight</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-xl text-[var(--primary)]">
                      {item.price}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm font-bold ${item.quantity > 0 ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                        {item.quantity} in stock
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button 
                          onClick={() => router.push(`/admin/shop/${item.id}`)}
                          className="p-2 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
}

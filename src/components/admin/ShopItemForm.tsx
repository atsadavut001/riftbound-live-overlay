"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShopItemForm({ shopItemId }: { shopItemId?: string }) {
  const router = useRouter();
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCardObj, setSelectedCardObj] = useState<any>(null);
  const [formData, setFormData] = useState<{
    cardId: string;
    price: number | string;
    quantity: number | string;
    print: string;
    highlight: boolean;
  }>({
    cardId: "",
    price: 0,
    quantity: 0,
    print: "Normal",
    highlight: false
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // If we just selected a card and the search term is precisely the code-name, don't trigger search again
    if (selectedCardObj && searchTerm === `${selectedCardObj.code} - ${selectedCardObj.name}`) {
      return;
    }
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, selectedCardObj]);

  useEffect(() => {
    if (shopItemId) return; // Don't search if we are editing
    
    const searchCards = async () => {
      setIsSearching(true);
      try {
        const resCards = await fetch(`/api/admin/cards?limit=20&search=${encodeURIComponent(debouncedSearchTerm)}`);
        const dataCards = await resCards.json();
        setCards(dataCards.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };
    searchCards();
  }, [debouncedSearchTerm, shopItemId]);

  useEffect(() => {
    const init = async () => {
      try {
        if (shopItemId) {
          const res = await fetch(`/api/admin/shop/${shopItemId}`);
          const data = await res.json();
          if (data) {
            setFormData({
              cardId: data.cardId,
              price: data.price,
              quantity: data.quantity,
              print: data.print || "Normal",
              highlight: data.highlight || false
            });
            if (data.card) {
              setCards([data.card]);
              setSelectedCardObj(data.card);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    init();
  }, [shopItemId]);

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = shopItemId ? `/api/admin/shop/${shopItemId}` : "/api/admin/shop";
      const method = shopItemId ? "PUT" : "POST";
      
      const payload = {
        ...formData,
        price: Number(formData.price) || 0,
        quantity: Number(formData.quantity) || 0,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        router.push("/admin/shop");
      } else {
        alert("Error saving item");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl max-w-2xl mx-auto flex flex-col">
      <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
        <h2 className="text-xl font-bold">{shopItemId ? "Edit Shop Item" : "Add Shop Item"}</h2>
        <button onClick={() => router.push("/admin/shop")} className="text-gray-400 hover:text-white">✕</button>
      </div>
      
      <form onSubmit={saveItem} className="p-6 flex-1 space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Card *</label>
          {shopItemId ? (
            <input 
              disabled 
              value={cards.find(c => c.id === formData.cardId) ? `${cards.find(c => c.id === formData.cardId).code} - ${cards.find(c => c.id === formData.cardId).name}` : 'Loading...'}
              className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 outline-none text-gray-500 cursor-not-allowed"
            />
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder="Search by code or name..."
                className="w-full bg-[#111] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--primary)] text-white"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                  if (formData.cardId) setFormData({ ...formData, cardId: "" }); // reset if typing
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              />
              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-[#1a1a1a] border border-[#333] rounded shadow-xl max-h-60 overflow-y-auto z-10">
                  {isSearching ? (
                    <div className="p-3 text-sm text-gray-500">Searching...</div>
                  ) : cards.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No cards found.</div>
                  ) : (
                    cards.map(c => (
                      <div 
                        key={c.id} 
                        className="px-3 py-2 hover:bg-[var(--primary)] hover:text-white cursor-pointer text-sm text-gray-300 transition-colors"
                        onClick={() => {
                          setFormData({ ...formData, cardId: c.id });
                          setSelectedCardObj(c);
                          setSearchTerm(`${c.code} - ${c.name}`);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span className="font-bold mr-2">{c.code}</span>
                        <span>{c.name}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          {shopItemId && <p className="text-xs text-gray-500 mt-1">Card cannot be changed once created.</p>}
          
          {selectedCardObj && (
            <div className="mt-4 p-4 bg-[#111] border border-[#333] rounded-lg flex gap-4 items-center">
              <div className="w-20 h-28 flex-shrink-0 bg-black rounded-md overflow-hidden border border-[#444]">
                {selectedCardObj.imageUrl ? (
                  <img src={selectedCardObj.imageUrl} alt={selectedCardObj.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">No img</div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">{selectedCardObj.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{selectedCardObj.code} &bull; {selectedCardObj.type} &bull; {selectedCardObj.rarity}</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">การพิมพ์ (Print)</label>
          <select 
            value={formData.print} 
            onChange={(e) => setFormData({...formData, print: e.target.value})}
            className="w-full bg-[#111] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--primary)] text-white mb-4"
          >
            <option value="Normal">Normal</option>
            <option value="Foil">Foil</option>
            <option value="Pomo">Pomo</option>
          </select>
        </div>

        <div className="flex items-center justify-between bg-[#111] border border-[var(--border)] rounded px-4 py-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-white">Highlight</label>
            <p className="text-xs text-gray-400 mt-0.5">Show this item prominently in the shop</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={formData.highlight}
              onChange={(e) => setFormData({...formData, highlight: e.target.checked})}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Price</label>
            <input 
              type="number" 
              step="0.01" 
              required 
              value={formData.price === "" || isNaN(Number(formData.price)) ? "" : formData.price} 
              onChange={e => {
                const val = parseFloat(e.target.value);
                setFormData({...formData, price: isNaN(val) ? '' : val});
              }} 
              className="w-full bg-[#111] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--primary)]" 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Quantity</label>
            <input 
              type="number" 
              required 
              value={formData.quantity === "" || isNaN(Number(formData.quantity)) ? "" : formData.quantity} 
              onChange={e => {
                const val = parseInt(e.target.value);
                setFormData({...formData, quantity: isNaN(val) ? '' : val});
              }} 
              className="w-full bg-[#111] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--primary)]" 
            />
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--border)] flex justify-end gap-3">
          <button type="button" onClick={() => router.push("/admin/shop")} className="px-4 py-2 rounded text-gray-300 hover:bg-gray-800 transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 font-medium">
            {loading ? "Saving..." : "Save Item"}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShopItemForm({ shopItemId }: { shopItemId?: string }) {
  const router = useRouter();
  const [cards, setCards] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    cardId: "",
    price: 0,
    quantity: 0
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

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
              quantity: data.quantity
            });
            if (data.card) {
              setCards([data.card]);
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
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Price</label>
            <input 
              type="number" 
              step="0.01" 
              required 
              value={formData.price} 
              onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} 
              className="w-full bg-[#111] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--primary)]" 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Quantity</label>
            <input 
              type="number" 
              required 
              value={formData.quantity} 
              onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} 
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

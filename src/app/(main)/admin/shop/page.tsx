"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminShopPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
    if (!search) return true;
    const s = search.toLowerCase();
    const name = (item.card?.name || "").toLowerCase();
    const code = (item.card?.code || "").toLowerCase();
    return name.includes(s) || code.includes(s);
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Shop Management</h1>
          <p className="text-gray-400">Manage Zberus Shop inventory and prices</p>
        </div>
        <Link 
          href="/admin/shop/new" 
          className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg"
        >
          + Add Shop Item
        </Link>
      </div>

      <div className="mb-6">
        <input 
          type="text" 
          placeholder="ค้นหาด้วยชื่อการ์ด หรือ รหัสการ์ด (Code)..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md bg-[#111] border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
      </div>
      
      <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
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
                {filteredItems.map((item) => (
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
      </div>
    </div>
  );
}

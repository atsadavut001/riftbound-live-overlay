"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated") {
      fetchCart();
    }
  }, [status, router]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cart?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-400">Loading cart...</div>;
  }

  const items = cart?.items || [];
  const subtotal = Number(cart?.totalAmount) || 0;
  const shippingFee = items.length > 0 ? (Number(cart?.shippingFee) || 50) : 0;
  const total = subtotal + shippingFee;

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-12 pb-24 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1 text-white">ตะกร้าสินค้าของคุณ</h1>
        <p className="text-gray-400">Riftbound Zberus Shop Cart</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: Items List */}
        <div className="w-full lg:w-2/3">
          {items.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-12 flex flex-col items-center justify-center text-gray-500">
              <div className="text-4xl mb-3">🛒</div>
              <p>ไม่มีสินค้าในตะกร้าของคุณ</p>
              <a href="/shop" className="mt-4 text-[var(--primary)] hover:underline">กลับไปเลือกซื้อสินค้า</a>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item: any, idx: number) => {
                const card = item.shopItem?.card;
                if (!card) return null;
                return (
                  <div key={idx} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex gap-4 w-full sm:w-auto flex-1">
                      <div className="w-20 aspect-[2/3] bg-black rounded-md overflow-hidden flex-shrink-0">
                        {card.imageUrl ? (
                          <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">No img</div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <h3 className="font-bold text-white text-base truncate">{card.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-400">{card.code} {card.rarity}</p>
                            {item.shopItem?.print && item.shopItem.print !== 'Normal' && (
                              <span className="bg-purple-900/40 text-purple-400 text-[10px] px-1.5 py-0 rounded font-bold border border-purple-800/50">
                                {item.shopItem.print}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-2 sm:mt-4 flex items-center gap-4">
                          <div className="text-sm">
                            <span className="text-gray-500">ราคา: </span>
                            <span className="text-white font-medium">฿{Number(item.shopItem?.price || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Controls & Total */}
                    <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto shrink-0 border-t border-[#333] sm:border-t-0 pt-3 sm:pt-0 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm hidden sm:inline-block">จำนวน: </span>
                        <div className="flex items-center bg-[#111] border border-[#333] rounded-md">
                          <button 
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-50"
                            disabled={item.quantity <= 1}
                            onClick={async () => {
                              const newQ = item.quantity - 1;
                              const res = await fetch("/api/cart", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ orderItemId: item.id, quantity: newQ })
                              });
                              if (res.ok) {
                                fetchCart();
                                window.dispatchEvent(new Event("cartUpdated"));
                              }
                            }}
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button 
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-50"
                            disabled={item.quantity >= item.shopItem.quantity}
                            onClick={async () => {
                              const newQ = item.quantity + 1;
                              const res = await fetch("/api/cart", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ orderItemId: item.id, quantity: newQ })
                              });
                              if (res.ok) {
                                fetchCart();
                                window.dispatchEvent(new Event("cartUpdated"));
                              } else {
                                const data = await res.json();
                                alert(data.error);
                              }
                            }}
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">(มี {item.shopItem.quantity} ชิ้น)</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-bold text-[var(--primary)]">
                          ฿{(Number(item.shopItem?.price || 0) * item.quantity).toFixed(2)}
                        </div>
                        <button 
                          className="text-sm text-red-400 hover:text-red-300 transition-colors"
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/cart", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ orderItemId: item.id })
                              });
                              if (res.ok) {
                                fetchCart();
                                window.dispatchEvent(new Event("cartUpdated"));
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Summary Column */}
        <div className="w-full lg:w-1/3 sticky top-24 flex flex-col gap-4">
          {/* Summary Box */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">สรุปคำสั่งซื้อ</h2>
            
            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>ยอดรวมสินค้า (Subtotal)</span>
                <span>฿{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>ค่าจัดส่ง (Shipping Fee)</span>
                <span>฿{shippingFee.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="border-t border-[#333] pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="text-gray-300 font-bold">ยอดสุทธิ (Total)</span>
                <span className="text-3xl font-bold text-[var(--primary)]">฿{total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              disabled={items.length === 0}
              onClick={() => router.push("/shop/checkout")}
            >
              ดำเนินการชำระเงิน
            </button>
          </div>
          
          {/* Contact Seller Button (Outside the box) */}
          <a 
            href="https://www.facebook.com/zberus/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
            </svg>
            ติดต่อผู้ขาย (Zberus)
          </a>
        </div>
      </div>
    </div>
  );
}

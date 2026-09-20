"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated") {
      fetchOrders();
    }
  }, [status, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.filter((o: any) => o.status !== 'cart'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [cancelling, setCancelling] = useState(false);

  if (loading || status === "loading") {
    return <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>;
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำสั่งซื้อนี้?")) return;
    
    setCancelling(true);
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "CANCEL" })
      });
      if (res.ok) {
        alert("ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว");
        setSelectedOrder(null);
        await fetchOrders();
      } else {
        alert("ไม่สามารถยกเลิกคำสั่งซื้อได้");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case "pending": return <span className="text-yellow-400">รอการชำระเงิน</span>;
      case "verifying": return <span className="text-blue-400">รอการตรวจสอบ</span>;
      case "slipok_pass": return <span className="text-blue-400">รอการตรวจสอบ</span>;
      case "slipok_fail": return <span className="text-red-500">ชำระเงินไม่สำเร็จ</span>;
      case "paid": return <span className="text-green-400">ชำระเงินแล้ว</span>;
      case "shipped": return <span className="text-purple-400">จัดส่งแล้ว</span>;
      case "cancelled": return <span className="text-gray-400">ยกเลิกแล้ว</span>;
      default: return <span className="text-gray-400">{status}</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 sm:p-12 max-w-5xl mx-auto w-full relative">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1 text-white">ประวัติการสั่งซื้อ</h1>
        <p className="text-gray-400">Riftbound Zberus Shop Orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-12 flex flex-col items-center justify-center text-gray-500">
          <div className="text-4xl mb-3">📦</div>
          <p>ยังไม่มีประวัติการสั่งซื้อ</p>
          <a href="/shop" className="mt-4 text-[var(--primary)] hover:underline">กลับไปเลือกซื้อสินค้า</a>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#222] border-b border-[#333]">
                  <th className="p-4 font-bold text-gray-400 text-sm">Order ID</th>
                  <th className="p-4 font-bold text-gray-400 text-sm">วันที่</th>
                  <th className="p-4 font-bold text-gray-400 text-sm text-right">ยอดรวม (฿)</th>
                  <th className="p-4 font-bold text-gray-400 text-sm text-center">สถานะ</th>
                  <th className="p-4 font-bold text-gray-400 text-sm text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-[#333] hover:bg-[#252525] transition-colors">
                    <td className="p-4 text-sm font-mono text-gray-300">
                      {order.id.split("-")[0]}...
                    </td>
                    <td className="p-4 text-sm text-gray-300">
                      {new Date(order.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-4 text-sm font-bold text-white text-right">
                      {(Number(order.totalAmount) + Number(order.shippingFee)).toFixed(2)}
                    </td>
                    <td className="p-4 text-sm text-center font-bold">
                      {getStatusDisplay(order.status)}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="px-4 py-2 border border-[#444] text-white hover:bg-[#333] hover:border-[#555] text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111] border border-[#333] rounded-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#333] flex justify-between items-center bg-[#1a1a1a]">
              <h2 className="text-xl font-bold text-white">รายละเอียดคำสั่งซื้อ</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div><span className="text-gray-500 block mb-1">Order ID</span> <span className="font-mono text-gray-300">{selectedOrder.id}</span></div>
                <div><span className="text-gray-500 block mb-1">วันที่สั่งซื้อ</span> <span className="text-gray-300">{new Date(selectedOrder.createdAt).toLocaleString('th-TH')}</span></div>
                <div><span className="text-gray-500 block mb-1">สถานะปัจจุบัน</span> <span className="font-bold">{getStatusDisplay(selectedOrder.status)}</span></div>
              </div>

              {selectedOrder.status === "shipped" && selectedOrder.trackingNumber && (
                <div className="mb-6 p-4 bg-[#222] rounded-lg border border-[#333] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">ข้อมูลการจัดส่ง</div>
                    <div className="text-white font-medium">
                      จัดส่งโดย: <span className="text-[var(--primary)]">{selectedOrder.courier}</span>
                    </div>
                    <div className="text-gray-300">
                      เลขพัสดุ: <span className="font-mono text-white">{selectedOrder.trackingNumber}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrder.trackingNumber);
                      alert("คัดลอกเลขพัสดุแล้ว!");
                    }}
                    className="px-4 py-2 bg-[#333] hover:bg-[#444] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border border-[#555]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    คัดลอกเลขพัสดุ
                  </button>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-bold text-white mb-2">รายการสินค้า</h3>
                <div className="bg-[#1a1a1a] rounded-lg p-4 space-y-2 text-sm border border-[#333]">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-gray-300">{item.quantity}x {item.shopItem?.card?.name || 'Unknown'}</span>
                      <span className="text-white">฿{(Number(item.priceAtTime) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-[#333] pt-2 mt-2 font-bold">
                    <span className="text-gray-400">ค่าจัดส่ง</span>
                    <span className="text-white">฿{Number(selectedOrder.shippingFee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-1">
                    <span className="text-white">ยอดรวมทั้งสิ้น</span>
                    <span className="text-[var(--primary)]">฿{(Number(selectedOrder.totalAmount) + Number(selectedOrder.shippingFee)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                {(selectedOrder.status === "pending" || selectedOrder.status === "slipok_fail") && (
                  <>
                    <button 
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      disabled={cancelling}
                      className="px-6 py-2 border border-red-500/50 text-red-500 hover:bg-red-500/10 text-sm font-bold rounded-lg transition-colors"
                    >
                      {cancelling ? "กำลังยกเลิก..." : "ยกเลิกคำสั่งซื้อ"}
                    </button>
                    <button 
                      onClick={() => router.push(`/shop/payment/${selectedOrder.id}`)}
                      className="px-6 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-bold rounded-lg transition-colors"
                    >
                      ชำระเงินใหม่
                    </button>
                  </>
                )}
                {selectedOrder.status === "slipok_fail" && (
                  <a 
                    href="https://www.facebook.com/zberus/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-6 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                  >
                    ติดต่อผู้ขาย
                  </a>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-[#1a1a1a] border-t border-[#333] flex justify-end">
              <button onClick={() => setSelectedOrder(null)} className="px-6 py-2 border border-[#444] text-white hover:bg-[#333] text-sm font-bold rounded transition-colors">
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

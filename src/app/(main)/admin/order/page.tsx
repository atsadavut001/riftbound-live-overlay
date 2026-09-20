"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminOrderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated") {
      if (!(session.user as any).isAdmin) {
        router.push("/");
        return;
      }
      fetchOrders();
    }
  }, [status, router]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?all=true&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.filter((o: any) => o.status !== "cart"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchId = order.id.toLowerCase().includes(q);
      const matchName = order.user?.name?.toLowerCase().includes(q);
      if (!matchId && !matchName) return false;
    }
    return true;
  });

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case "pending": return <span className="text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full text-xs font-bold">รอการชำระเงิน</span>;
      case "verifying": return <span className="text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full text-xs font-bold">รอการตรวจสอบ</span>;
      case "slipok_pass": return <span className="text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full text-xs font-bold">รอการตรวจสอบ (slipOK pass)</span>;
      case "slipok_fail": return <span className="text-red-500 bg-red-500/10 px-3 py-1 rounded-full text-xs font-bold">ชำระเงินไม่สำเร็จ</span>;
      case "paid": return <span className="text-green-400 bg-green-400/10 px-3 py-1 rounded-full text-xs font-bold">ชำระเงินแล้ว</span>;
      case "shipped": return <span className="text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full text-xs font-bold">จัดส่งแล้ว</span>;
      case "cancelled": return <span className="text-gray-400 bg-gray-400/10 px-3 py-1 rounded-full text-xs font-bold">ยกเลิกแล้ว</span>;
      default: return <span className="text-gray-400 bg-gray-400/10 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const handleAction = async (orderId: string, action: "NEXT_STATUS" | "REJECT_SLIP") => {
    if (action === "NEXT_STATUS" && selectedOrder?.status === "paid") {
      if (!trackingNumber.trim() || !courier.trim()) {
        alert("กรุณากรอกเลขพัสดุและผู้จัดส่งให้ครบถ้วน");
        return;
      }
    }

    setUpdating(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          orderId, 
          action,
          trackingNumber,
          courier
        })
      });
      if (res.ok) {
        await fetchOrders();
        setSelectedOrder(null);
      } else {
        alert("อัปเดตไม่สำเร็จ");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setUpdating(false);
    }
  };

  const openModal = (order: any) => {
    setSelectedOrder(order);
    setTrackingNumber(order.trackingNumber || "");
    setCourier(order.courier || "");
  };

  if (loading && orders.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-gray-400">Loading orders...</div>;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Order Management</h1>
          <p className="text-gray-400">จัดการคำสั่งซื้อทั้งหมดในระบบ</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <input 
            type="text"
            placeholder="ค้นหา Order ID หรือชื่อผู้ซื้อ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--primary)] min-w-[250px]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--primary)]"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="pending">รอการชำระเงิน</option>
            <option value="verifying">รอการตรวจสอบ</option>
            <option value="slipok_pass">รอการตรวจสอบ (slipOK pass)</option>
            <option value="slipok_fail">ชำระเงินไม่สำเร็จ</option>
            <option value="paid">ชำระเงินแล้ว</option>
            <option value="shipped">จัดส่งแล้ว</option>
            <option value="cancelled">ยกเลิกแล้ว</option>
          </select>
        </div>
      </div>
      
      <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden relative">
        {updating && (
          <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
            <span className="text-white font-bold">กำลังอัปเดต...</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a1a1a] border-b border-[#333]">
                <th className="p-4 font-bold text-gray-400 text-sm w-32">Order ID</th>
                <th className="p-4 font-bold text-gray-400 text-sm">วันที่</th>
                <th className="p-4 font-bold text-gray-400 text-sm">ชื่อผู้ซื้อ</th>
                <th className="p-4 font-bold text-gray-400 text-sm">ยอดเงิน (฿)</th>
                <th className="p-4 font-bold text-gray-400 text-sm text-center">สถานะ</th>
                <th className="p-4 font-bold text-gray-400 text-sm text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    ไม่พบข้อมูลคำสั่งซื้อ
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-[#222] hover:bg-[#161616] transition-colors">
                    <td className="p-4 text-sm font-mono text-gray-300">
                      {order.id.split("-")[0]}...
                    </td>
                    <td className="p-4 text-sm text-gray-300">
                      {new Date(order.createdAt).toLocaleString('th-TH', { 
                        dateStyle: 'short', timeStyle: 'short' 
                      })}
                    </td>
                    <td className="p-4 text-sm text-white font-medium">
                      {order.user?.name || "Unknown"}
                    </td>
                    <td className="p-4 text-sm font-bold text-[var(--primary)]">
                      {(Number(order.totalAmount) + Number(order.shippingFee)).toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      {getStatusDisplay(order.status)}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => openModal(order)}
                        className="text-gray-400 hover:text-[var(--primary)] transition-colors inline-flex items-center justify-center p-2 rounded hover:bg-[#333]"
                        title="แก้ไข/ดูรายละเอียด"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Details & Edit */}
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
                <div><span className="text-gray-500 block mb-1">ชื่อผู้ซื้อ</span> <span className="text-gray-300">{selectedOrder.user?.name}</span></div>
                <div><span className="text-gray-500 block mb-1">สถานะปัจจุบัน</span> {getStatusDisplay(selectedOrder.status)}</div>
              </div>

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

              {selectedOrder.slipUrl && (
                <div className="mb-6">
                  <h3 className="font-bold text-white mb-2">สลิปการโอนเงิน</h3>
                  <div className="bg-[#1a1a1a] rounded-lg p-2 border border-[#333] flex justify-center">
                    <img src={selectedOrder.slipUrl} alt="Payment Slip" className="max-h-[300px] object-contain rounded" />
                  </div>
                </div>
              )}

              {selectedOrder.status === "paid" && (
                <div className="mb-6 p-4 bg-[#1a1a1a] border border-[#333] rounded-lg space-y-4">
                  <h3 className="font-bold text-white">ข้อมูลการจัดส่งพัสดุ</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">ผู้ให้บริการจัดส่ง (Courier) <span className="text-red-500">*</span></label>
                      <select 
                        value={courier} 
                        onChange={(e) => setCourier(e.target.value)} 
                        className="w-full bg-[#111] border border-[#444] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--primary)]"
                      >
                        <option value="">เลือกผู้จัดส่ง...</option>
                        <option value="Kerry">Kerry Express</option>
                        <option value="J&T">J&T Express</option>
                        <option value="EMS">Thailand Post (EMS)</option>
                        <option value="Flash">Flash Express</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">เลขพัสดุ (Tracking No.) <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={trackingNumber} 
                        onChange={(e) => setTrackingNumber(e.target.value)} 
                        placeholder="กรอกเลขพัสดุ" 
                        className="w-full bg-[#111] border border-[#444] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {(selectedOrder.status === "shipped") && (
                <div className="mb-6 p-4 bg-[#1a1a1a] border border-[#333] rounded-lg space-y-2 text-sm">
                  <h3 className="font-bold text-white mb-2">ข้อมูลการจัดส่งพัสดุ</h3>
                  <div><span className="text-gray-500">ผู้ให้บริการ:</span> {selectedOrder.courier}</div>
                  <div><span className="text-gray-500">เลขพัสดุ:</span> <span className="text-[var(--primary)] font-mono">{selectedOrder.trackingNumber}</span></div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-[#1a1a1a] border-t border-[#333] flex justify-end gap-3">
              {(selectedOrder.status === "verifying" || selectedOrder.status === "slipok_pass" || selectedOrder.status === "slipok_fail") && (
                <>
                  <button onClick={() => handleAction(selectedOrder.id, "REJECT_SLIP")} disabled={updating} className="px-4 py-2 bg-[#333] hover:bg-red-500/20 hover:text-red-500 text-white text-sm font-bold rounded transition-colors border border-transparent hover:border-red-500">
                    ปฏิเสธสลิป / ไม่ผ่าน
                  </button>
                  <button onClick={() => handleAction(selectedOrder.id, "NEXT_STATUS")} disabled={updating} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded transition-colors">
                    ยืนยันการชำระเงิน
                  </button>
                </>
              )}
              
              {selectedOrder.status === "paid" && (
                <button onClick={() => handleAction(selectedOrder.id, "NEXT_STATUS")} disabled={updating} className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-bold rounded transition-colors">
                  อัปเดตเป็น "จัดส่งแล้ว"
                </button>
              )}
              
              <button onClick={() => setSelectedOrder(null)} disabled={updating} className="px-4 py-2 border border-[#444] text-white hover:bg-[#333] text-sm font-bold rounded transition-colors">
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

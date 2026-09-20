"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [step, setStep] = useState<"address" | "summary">("address");
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    street: "",
    subDistrict: "",
    district: "",
    province: "",
    zipCode: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cartRes, addrRes] = await Promise.all([
        fetch(`/api/cart?t=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/address?t=${Date.now()}`, { cache: "no-store" })
      ]);
      
      if (cartRes.ok) {
        const data = await cartRes.json();
        if (!data?.items?.length) {
          router.push("/shop/cart");
          return;
        }
        setCart(data);
      }
      
      if (addrRes.ok) {
        const addr = await addrRes.json();
        if (addr.id) {
          // split address and street if necessary, but we only have `address` field in DB.
          // The user asked for "ที่อยู่ ถนน". I will just store street in the same address string or separately.
          // Wait, the DB schema has `address`, `province`, `district`, `subDistrict`, `zipCode`. 
          // It doesn't have `street`. So I'll put street inside `address` field or handle it in UI.
          setFormData({
            name: addr.name || "",
            phone: addr.phone || "",
            address: addr.address || "",
            street: "",
            subDistrict: addr.subDistrict || "",
            district: addr.district || "",
            province: addr.province || "",
            zipCode: addr.zipCode || ""
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          address: formData.street ? `${formData.address} ถ.${formData.street}` : formData.address,
          subDistrict: formData.subDistrict,
          district: formData.district,
          province: formData.province,
          zipCode: formData.zipCode
        })
      });
      if (res.ok) {
        setStep("summary");
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกที่อยู่");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการบันทึกที่อยู่");
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-400">Loading checkout...</div>;
  }

  const items = cart?.items || [];
  const subtotal = Number(cart?.totalAmount) || 0;
  const shippingFee = items.length > 0 ? (Number(cart?.shippingFee) || 50) : 0;
  const total = subtotal + shippingFee;

  return (
    <div className="flex-1 flex flex-col p-8 sm:p-12 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1 text-white">ดำเนินการสั่งซื้อ</h1>
        <div className="flex items-center gap-4 text-sm mt-4">
          <span className={`font-bold ${step === 'address' ? 'text-[var(--primary)]' : 'text-gray-400'}`}>1. ที่อยู่จัดส่ง</span>
          <span className="text-gray-600">&gt;</span>
          <span className={`font-bold ${step === 'summary' ? 'text-[var(--primary)]' : 'text-gray-400'}`}>2. สรุปคำสั่งซื้อและการชำระเงิน</span>
        </div>
      </div>

      {step === "address" && (
        <form onSubmit={handleAddressSubmit} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">ข้อมูลที่อยู่สำหรับจัดส่ง</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">ชื่อผู้รับ <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#222] border border-[#444] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-[#222] border border-[#444] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--primary)]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">ที่อยู่ (บ้านเลขที่, หมู่, ซอย, อาคาร) <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-[#222] border border-[#444] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--primary)]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">ถนน (ไม่บังคับ)</label>
              <input type="text" value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} className="w-full bg-[#222] border border-[#444] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">ตำบล/แขวง <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.subDistrict} onChange={(e) => setFormData({...formData, subDistrict: e.target.value})} className="w-full bg-[#222] border border-[#444] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">อำเภอ/เขต <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} className="w-full bg-[#222] border border-[#444] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">จังหวัด <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.province} onChange={(e) => setFormData({...formData, province: e.target.value})} className="w-full bg-[#222] border border-[#444] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.zipCode} onChange={(e) => setFormData({...formData, zipCode: e.target.value})} className="w-full bg-[#222] border border-[#444] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--primary)]" />
            </div>
          </div>
          
          <div className="flex justify-end gap-4 mt-8">
            <button type="button" onClick={() => router.push("/shop/cart")} className="px-6 py-3 rounded-xl border border-[#444] text-white font-bold hover:bg-[#222] transition-colors">
              กลับไปที่ตะกร้า
            </button>
            <button type="submit" className="px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)] transition-colors">
              ยืนยันที่อยู่จัดส่ง
            </button>
          </div>
        </form>
      )}

      {step === "summary" && (
        <div className="space-y-6">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">ข้อมูลการจัดส่ง</h2>
              <button onClick={() => setStep("address")} className="text-sm text-[var(--primary)] hover:underline">แก้ไข</button>
            </div>
            <div className="text-gray-300 text-sm space-y-2">
              <p><span className="text-gray-500 mr-2">ชื่อผู้รับ:</span> {formData.name}</p>
              <p><span className="text-gray-500 mr-2">เบอร์โทร:</span> {formData.phone}</p>
              <p><span className="text-gray-500 mr-2">ที่อยู่:</span> {formData.street ? `${formData.address} ถ.${formData.street}` : formData.address} ต.{formData.subDistrict} อ.{formData.district} จ.{formData.province} {formData.zipCode}</p>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">รายละเอียดคำสั่งซื้อ</h2>
            <div className="space-y-4 mb-6">
              {items.map((item: any, idx: number) => {
                const card = item.shopItem?.card;
                if (!card) return null;
                return (
                  <div key={idx} className="flex gap-4 items-center border-b border-[#333] pb-4 last:border-0 last:pb-0">
                    <div className="w-12 aspect-[2/3] bg-black rounded overflow-hidden flex-shrink-0">
                      {card.imageUrl && <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-sm">{card.name}</h3>
                      <p className="text-xs text-gray-400">จำนวน: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[var(--primary)]">
                        ฿{(Number(item.shopItem?.price || 0) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t border-[#333] pt-6 space-y-3 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>มูลค่าสินค้า</span>
                <span>฿{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>ค่าจัดส่ง</span>
                <span>฿{shippingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-[#333]">
                <span className="text-white font-bold">ยอดรวมทั้งสิ้น</span>
                <span className="text-2xl font-bold text-[var(--primary)]">฿{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <button onClick={() => setStep("address")} className="px-6 py-3 rounded-xl border border-[#444] text-white font-bold hover:bg-[#222] transition-colors">
              ย้อนกลับ
            </button>
            <button onClick={() => router.push(`/shop/payment/${cart.id}`)} className="px-8 py-3 rounded-xl bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)] transition-colors">
              ดำเนินการชำระเงิน
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

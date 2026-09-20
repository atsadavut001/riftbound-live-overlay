"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

export default function PaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated" && orderId) {
      fetchPaymentData();
    }
  }, [status, orderId, router]);

  const fetchPaymentData = async () => {
    try {
      // We need to generate QR. POST /api/payment/qr
      const res = await fetch(`/api/payment/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      if (res.ok) {
        const data = await res.json();
        setQrUrl(data.qrUrl);
        setOrder({ ...data.order, status: data.status });
      } else {
        alert("ไม่พบคำสั่งซื้อ หรือเกิดข้อผิดพลาด");
        router.push("/shop/orders");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSlip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("slip", file);
      
      const res = await fetch("/api/payment/upload-slip", {
        method: "POST",
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setOrder((prev: any) => ({ ...prev, status: data.status }));
        alert("อัปโหลดสลิปสำเร็จ รอการตรวจสอบ");
      } else {
        alert("อัปโหลดสลิปไม่สำเร็จ");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-400">Loading payment...</div>;
  }

  return (
    <div className="flex-1 flex flex-col p-8 sm:p-12 max-w-3xl mx-auto w-full">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-1 text-white">ชำระเงิน</h1>
        <p className="text-gray-400">Order ID: {orderId}</p>
      </div>

      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 flex flex-col items-center">
        {order?.status === "slipok_fail" && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg w-full mb-6 text-center">
            ชำระเงินไม่สำเร็จ กรุณาตรวจสอบสลิปและทำรายการใหม่
          </div>
        )}

        {(order?.status === "verifying" || order?.status === "slipok_pass") ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-white mb-2">รอการตรวจสอบ</h2>
            <p className="text-gray-400">ระบบกำลังตรวจสอบสลิปการโอนเงินของคุณ</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-6">สแกน QR Code เพื่อชำระเงิน</h2>
            <div className="bg-white p-4 rounded-xl mb-6">
              {qrUrl ? (
                <img src={qrUrl} alt="PromptPay QR Code" className="w-64 h-64 object-contain" />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-gray-400">QR Code Error</div>
              )}
            </div>
            
            <div className="w-full max-w-sm mb-6">
              <label className="block w-full text-center px-6 py-4 rounded-xl border-2 border-dashed border-[#444] text-gray-400 hover:text-white hover:border-[var(--primary)] transition-colors cursor-pointer">
                {uploading ? "กำลังอัปโหลด..." : "อัปโหลดสลิปโอนเงิน"}
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadSlip} disabled={uploading} />
              </label>
            </div>
          </>
        )}

        <button 
          onClick={() => router.push("/shop/orders")} 
          className="mt-4 px-6 py-3 rounded-xl bg-[#222] text-white font-bold hover:bg-[#333] transition-colors"
        >
          ไปหน้าประวัติการสั่งซื้อ
        </button>
      </div>
    </div>
  );
}

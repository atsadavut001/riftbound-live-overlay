"use client";

import { useState } from "react";
import Image from "next/image";
import DonateModal from "@/components/DonateModal";

export default function AboutPage() {
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showDonateModal, setShowDonateModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !description) return;
    
    // Client-side rate limit check via localStorage
    const lastSubmit = localStorage.getItem("lastIssueSubmit");
    if (lastSubmit) {
      const timeSince = Date.now() - parseInt(lastSubmit);
      if (timeSince < 5 * 60 * 1000) { // 5 minutes
        setMessage({ type: "error", text: "คุณส่งข้อเสนอแนะไปแล้ว กรุณารอสักครู่ (5 นาที) ก่อนส่งอีกครั้ง" });
        return;
      }
    }

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, description }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "ส่งข้อมูลเรียบร้อยแล้ว ขอบคุณสำหรับข้อเสนอแนะครับ!" });
        setEmail("");
        setDescription("");
        localStorage.setItem("lastIssueSubmit", Date.now().toString());
      } else {
        setMessage({ type: "error", text: data.error || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-8 sm:p-12">
      <h1 className="text-3xl font-bold mb-10 text-center">เกี่ยวกับ Riftbound Live Overlay</h1>
      
      <div className="space-y-8">
        {/* Section 1: About and How to use */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold mb-4 text-[var(--primary)]">เกี่ยวกับเว็บไซต์และวิธีใช้งาน Overlay</h2>
          <div className="text-gray-300 space-y-4 leading-relaxed">
            <p>
              เว็บไซต์นี้ถูกสร้างขึ้นเพื่อช่วยเหลือสตรีมเมอร์ในคอมมูนิตี้เกม Riftbound ในการแสดงผลข้อมูลบนหน้าจอ (Overlay) อย่างสวยงามและเป็นมืออาชีพ 
              โดยระบบจะให้คุณสามารถจัดการคะแนน, รายชื่อผู้เล่น, ตัวนับเวลา และแสดงรูปการ์ดได้แบบเรียลไทม์
            </p>
            <h3 className="text-lg font-medium text-white mt-4">วิธีการใช้งานเบื้องต้น:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>ล็อกอินเข้าสู่ระบบและไปที่หน้า <strong>Overlay</strong> (จากเมนูด้านบน)</li>
              <li>สร้างห้องหรือเลือกระบบ Overlay ที่ต้องการใช้ พร้อมคัดลอกลิงก์ที่ระบบสร้างให้</li>
              <li>นำลิงก์ไปใส่เป็น <strong>Browser Source</strong> ในโปรแกรมสตรีม (เช่น OBS, Streamlabs, Prism Live)</li>
              <li>ปรับแต่งข้อมูลต่างๆ เช่น ชื่อผู้เล่น หรือคะแนน ผ่านหน้าต่างควบคุม (Control Panel) บนเว็บไซต์</li>
              <li>ข้อมูลจะอัปเดตแบบเรียลไทม์บนจอสตีมทันทีที่คุณกดเปลี่ยนในหน้าควบคุม</li>
            </ul>
          </div>
        </section>

        {/* Section 2: Roadmap */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold mb-4 text-[var(--primary)]">ฟีเจอร์ปัจจุบันและแผนการพัฒนา (Roadmap)</h2>
          <div className="text-gray-300 space-y-8">
            
            <div>
              <h3 className="text-xl font-medium mb-3 text-white">✨ ระบบที่เปิดใช้งานแล้ว (Current Features)</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">✓</span>
                  <span><strong>Card Library:</strong> ฐานข้อมูลการ์ด ค้นหาและกรองการ์ดได้อย่างรวดเร็ว</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">✓</span>
                  <span><strong>Deck Builder:</strong> ระบบจัดเด็คอัตโนมัติ พร้อมตรวจจับกฎกติกาการจัดเด็คและเตือนทันที</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">✓</span>
                  <span><strong>Decks Library & My Decks:</strong> ดูเด็คที่เปิดสาธารณะ และจัดการเด็คส่วนตัว</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">✓</span>
                  <span><strong>Deck View:</strong> หน้ารายละเอียดเด็ค แสดงสัดส่วนการ์ด ค่าพลังเฉลี่ย และจัดกลุ่มการ์ดให้ดูง่าย</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">✓</span>
                  <span><strong>Live Overlay:</strong> หน้าต่างแสดงผลสำหรับนำไปใช้บน OBS, XSplit ได้ทันที</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3 text-white">🚀 แผนการพัฒนาในอนาคต (Upcoming Roadmap)</h3>
              <p className="mb-4 text-sm">เรามุ่งมั่นที่จะพัฒนาระบบให้ตอบโจทย์ผู้เล่นและสตรีมเมอร์มากขึ้น นี่คือเป้าหมายถัดไปของเรา:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700/50 text-gray-400 flex items-center justify-center text-sm font-bold">...</span>
                  <span>(รอเพิ่มแผนงานถัดไป 1)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700/50 text-gray-400 flex items-center justify-center text-sm font-bold">...</span>
                  <span>(รอเพิ่มแผนงานถัดไป 2)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700/50 text-gray-400 flex items-center justify-center text-sm font-bold">...</span>
                  <span>(รอเพิ่มแผนงานถัดไป 3)</span>
                </li>
              </ul>
            </div>

          </div>
        </section>

        {/* Section 3: Issues and Support */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold mb-4 text-[var(--primary)]">แจ้งปัญหาและการสนับสนุน</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-white mb-3">พบปัญหาหรือมีข้อเสนอแนะ?</h3>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                หากพบว่าระบบทำงานผิดปกติ หรือมีไอเดียฟีเจอร์ใหม่ๆ สามารถส่งข้อความหาทีมพัฒนาได้โดยตรง
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email สำหรับติดต่อกลับ</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-[#111] border border-[var(--border)] rounded-lg text-white focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">ปัญหาที่พบ / ข้อเสนอแนะ</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-4 py-2 bg-[#111] border border-[var(--border)] rounded-lg text-white focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] resize-none"
                    placeholder="อธิบายรายละเอียด..."
                  ></textarea>
                </div>
                
                {message.text && (
                  <div className={"p-3 rounded-lg text-sm "}>
                    {message.text}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "กำลังส่ง..." : "ส่งข้อความ"}
                </button>
              </form>
            </div>
            
            <div className="md:border-l border-[var(--border)] md:pl-8">
              <h3 className="text-lg font-medium text-[#FF5E5B] mb-3">สนับสนุนโปรเจกต์</h3>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                เราให้บริการระบบนี้ฟรี เพื่อช่วยเหลือคอมมูนิตี้! หากถูกใจและอยากเป็นกำลังใจให้ผู้พัฒนา สามารถสนับสนุนเป็นค่ากาแฟหรือค่าเซิร์ฟเวอร์ได้ครับ ☕
              </p>
              <button 
                onClick={() => setShowDonateModal(true)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black hover:bg-gray-200 rounded-lg transition-colors font-bold shadow-sm"
              >
                Buy me a coffee / โดเนท
              </button>
              
              <div className="mt-8 pt-8 border-t border-[var(--border)]">
                <h3 className="text-sm font-medium text-gray-400 mb-3">ช่องทางการติดตาม</h3>
                <div className="space-y-3">
                  <a 
                    href="https://kick.com/zberus-studio" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-center gap-2 w-full py-2 bg-[#53FC18]/10 hover:bg-[#53FC18]/20 text-[#53FC18] rounded-lg transition-colors font-medium text-sm"
                  >
                    สตรีม Kick
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Donate Modal */}
      {showDonateModal && <DonateModal onClose={() => setShowDonateModal(false)} />}
    </div>
  );
}
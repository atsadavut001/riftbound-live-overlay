export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-20 text-center">
      <h1 className="text-4xl sm:text-6xl font-bold mb-6">
        ควบคุม <span className="text-[var(--primary)]">Riftbound Live Overlay</span> ได้ดั่งใจ
      </h1>
      <p className="text-lg text-gray-400 max-w-2xl mb-10 text-balance">
        สร้าง Overlay URL เฉพาะสำหรับช่องสตรีมของคุณ นำไปใส่ใน OBS ได้ทันที 
        ปรับคะแนน, เปลี่ยนชื่อผู้เล่น, จัดการระบบนับเวลาแบบเรียลไทม์ 
        พร้อมแสดงรูปการ์ดสวยงามบนหน้าจอขณะสตรีม
      </p>
      
      <div className="flex gap-4">
        <a 
          href="/overlapanal"
          className="rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-8 py-3 text-lg font-semibold transition-colors"
        >
          เริ่มต้นใช้งานฟรี
        </a>
        <a 
          href="/about"
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] hover:border-gray-500 px-8 py-3 text-lg font-semibold transition-colors"
        >
          ติดต่อและผู้สนับสนุน
        </a>
      </div>

      <div className="mt-16 w-full max-w-4xl aspect-video rounded-xl overflow-hidden shadow-2xl border border-[var(--border)]">
        <iframe 
          width="100%" 
          height="100%" 
          src="https://www.youtube.com/embed/BMX1IV8ePJ0" 
          title="YouTube video player" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          referrerPolicy="strict-origin-when-cross-origin" 
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}

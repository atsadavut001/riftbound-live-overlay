export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-16 text-center max-w-7xl mx-auto w-full">
      <div className="space-y-4 mb-16">
        <h1 className="text-4xl sm:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-blue-400">
          Zberus Rift Service
        </h1>
        <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto text-balance">
          ศูนย์รวมเครื่องมือครบวงจรสำหรับผู้เล่นและสตรีมเมอร์เกมการ์ด Riftbound <br className="hidden sm:block" />
          ไม่ว่าจะจัดเด็ค, นับคะแนนเวลาเล่นจริง, หรือจัดหน้าจอสตรีมบน OBS ก็ทำได้ในที่เดียว
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full mb-20">
        {/* Card 1: Points Tracker */}
        <div className="bg-[#1a1a1a] border border-[#333] hover:border-blue-500 rounded-2xl p-8 flex flex-col text-left transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1">
          <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white">Points Tracker</h2>
          <p className="text-gray-400 flex-1 mb-8">
            เครื่องมือนับคะแนนและ XP สำหรับการเล่นการ์ดของจริงบนโต๊ะ มาพร้อมนาฬิกาจับเวลาและระบบทอยเหรียญ 3D
          </p>
          <a 
            href="/points-tracker"
            className="w-full text-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white px-6 py-3 font-semibold transition-all"
          >
            เปิดตัวนับคะแนน
          </a>
        </div>

        {/* Card 2: Live Overlay */}
        <div className="bg-[#1a1a1a] border border-[#333] hover:border-purple-500 rounded-2xl p-8 flex flex-col text-left transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-1">
          <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white">Live Overlay</h2>
          <p className="text-gray-400 flex-1 mb-8">
            สร้าง Overlay URL เฉพาะสำหรับช่องสตรีมของคุณ นำไปใส่ใน OBS เพื่อแสดงคะแนนและการ์ดให้คนดูเห็นแบบเรียลไทม์
          </p>
          <a 
            href="/overlay"
            className="w-full text-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600 hover:text-white px-6 py-3 font-semibold transition-all"
          >
            จัดการ Overlay
          </a>
        </div>

        {/* Card 3: Decks & Cards */}
        <div className="bg-[#1a1a1a] border border-[#333] hover:border-green-500 rounded-2xl p-8 flex flex-col text-left transition-all hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] hover:-translate-y-1">
          <div className="w-14 h-14 bg-green-500/10 text-green-400 rounded-xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white">Card Database</h2>
          <p className="text-gray-400 flex-1 mb-8">
            ฐานข้อมูลการ์ดทั้งหมด ค้นหาข้อมูลการ์ด ดูรายละเอียดสกิลและสถานะต่างๆ เพื่อใช้ประกอบการจัดเด็ค
          </p>
          <a 
            href="/decks"
            className="w-full text-center rounded-xl bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600 hover:text-white px-6 py-3 font-semibold transition-all"
          >
            ดูการ์ดทั้งหมด
          </a>
        </div>

        {/* Card 4: Shop */}
        <div className="bg-[#1a1a1a] border border-[#333] hover:border-yellow-500 rounded-2xl p-8 flex flex-col text-left transition-all hover:shadow-[0_0_30px_rgba(234,179,8,0.15)] hover:-translate-y-1">
          <div className="w-14 h-14 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white">Riftbound Shop</h2>
          <p className="text-gray-400 flex-1 mb-8">
            เลือกซื้อซองสุ่มการ์ด (Booster Pack) และกล่อง Starter Deck สำหรับเริ่มต้นเล่นเกมได้ที่นี่
          </p>
          <a 
            href="/shop"
            className="w-full text-center rounded-xl bg-yellow-600/20 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-600 hover:text-white px-6 py-3 font-semibold transition-all"
          >
            เข้าสู่ร้านค้า
          </a>
        </div>
      </div>

      {/* Video Section */}
      <h2 className="text-2xl font-bold mb-6 text-gray-300">ตัวอย่างการใช้งาน Overlay สำหรับสตรีมเมอร์</h2>
      <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-[#333] mb-8">
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

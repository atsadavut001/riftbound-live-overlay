"use client";

interface DonateModalProps {
  onClose: () => void;
}

export default function DonateModal({ onClose }: DonateModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        
        <h2 className="text-2xl font-bold mb-2 text-center text-white">สนับสนุนผู้พัฒนา ☕</h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          ขอบคุณที่สนใจสนับสนุนโปรเจกต์ของเราครับ!
        </p>
        
        <div className="space-y-4">
          <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
            <h3 className="font-semibold text-[var(--primary)] mb-2 text-center">พร้อมเพย์ (PromptPay)</h3>
            <div className="bg-white p-2 rounded-lg flex items-center justify-center mb-3 mx-auto w-fit">
              <img 
                src="https://qugqegaqjrcwkxnvohvv.supabase.co/storage/v1/object/public/ZberusTCG/PromptPayQR.jpg" 
                alt="PromptPay QR Code" 
                className="w-48 h-48 object-contain rounded-md"
              />
            </div>
            <div className="text-center">
              <p className="text-gray-300 font-medium text-sm">สแกนเพื่อสนับสนุนผ่านพร้อมเพย์</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="h-px bg-[var(--border)] flex-1"></div>
            <span className="text-xs text-gray-500">หรือ</span>
            <div className="h-px bg-[var(--border)] flex-1"></div>
          </div>
          
          <a 
            href="https://buymeacoffee.com/zberus_studio" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#FFDD00] text-black hover:bg-[#FFEA00] rounded-lg transition-colors font-bold shadow-sm"
          >
            Buy me a coffee
          </a>
          <a 
            href="https://ko-fi.com/zberus_studio" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#29abe0] text-white hover:bg-[#1f87b2] rounded-lg transition-colors font-bold shadow-sm"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.061-4.3-.037-.046-.045-.085-.045-.085-.236-.874.05-1.744.5-2.074 1.015-.745 2.207-.538 3.168 1.547 1.25-1.954 2.239-2.311 3.237-1.541.52.394.908 1.18.665 2.144-.047.173-1.035 2.304-1.035 2.304z"/></svg>
            Support on Ko-fi
          </a>
        </div>
      </div>
    </div>
  );
}

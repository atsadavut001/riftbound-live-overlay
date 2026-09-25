"use client";

import { useState } from "react";
import DonateModal from "./DonateModal";

export default function Footer() {
  const [showDonateModal, setShowDonateModal] = useState(false);

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] relative py-4 text-sm text-gray-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between">
        <div className="flex-1 text-center pr-20">
          &copy; 2026 Zberus Rift Service
        </div>
        <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2">
          <button 
            onClick={() => setShowDonateModal(true)}
            className="flex items-center gap-1.5 text-sm font-bold bg-[#29abe0] text-white px-3 py-1.5 rounded-lg hover:bg-[#1f87b2] transition-colors shadow-lg hover:shadow-[#29abe0]/30"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.061-4.3-.037-.046-.045-.085-.045-.085-.236-.874.05-1.744.5-2.074 1.015-.745 2.207-.538 3.168 1.547 1.25-1.954 2.239-2.311 3.237-1.541.52.394.908 1.18.665 2.144-.047.173-1.035 2.304-1.035 2.304z"/></svg>
            Support
          </button>
        </div>
      </div>
      {showDonateModal && <DonateModal onClose={() => setShowDonateModal(false)} />}
    </footer>
  );
}

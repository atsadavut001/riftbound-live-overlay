"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import DonateModal from "./DonateModal";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdminPanel = pathname?.startsWith("/admin");
  const [showDonateModal, setShowDonateModal] = useState(false);

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          <a href="/" className="text-xl font-bold text-[var(--primary)]">
            Riftbound Overlay
          </a>
        </div>
        <div className="flex items-center gap-6">
          {!isAdminPanel && (
            <>
              <a href="/" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">Home</a>
              <a href="/cards" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">Card Library</a>
              <a href="/about" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">About us</a>
            </>
          )}
          
          {session?.user ? (
            <div className="flex items-center gap-4">
              {!isAdminPanel && (
                <>
                  <a href="/overlapanal" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">
                    Overlay
                  </a>
                  <button 
                    onClick={() => setShowDonateModal(true)}
                    className="flex items-center gap-1.5 text-sm font-bold bg-[#29abe0] text-white px-3 py-1.5 rounded-lg hover:bg-[#1f87b2] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.061-4.3-.037-.046-.045-.085-.045-.085-.236-.874.05-1.744.5-2.074 1.015-.745 2.207-.538 3.168 1.547 1.25-1.954 2.239-2.311 3.237-1.541.52.394.908 1.18.665 2.144-.047.173-1.035 2.304-1.035 2.304z"/></svg>
                    Support
                  </button>
                </>
              )}
              <div className={`flex items-center gap-4 ${!isAdminPanel ? 'pl-4 border-l border-[var(--border)]' : ''}`}>
                {(session.user as any).isAdmin && !isAdminPanel && (
                  <a href="/admin" className="text-sm font-medium text-[#f59e0b] hover:text-[#fbbf24] transition-colors">
                    Admin Panel
                  </a>
                )}
                {isAdminPanel && (
                  <a href="/" className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors pr-4 border-r border-[var(--border)]">
                    User Panel
                  </a>
                )}
                <div className="flex items-center gap-2">
                  {session.user.image && (
                  <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full border border-gray-600" />
                )}
                <span className="text-sm font-medium hidden sm:inline-block">{session.user.name}</span>
                </div>
              </div>
              <button 
                onClick={() => signOut()}
                className="text-sm text-red-400 hover:text-red-300 transition-colors ml-2"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {!isAdminPanel && (
                <button 
                  onClick={() => setShowDonateModal(true)}
                  className="flex items-center gap-1.5 text-sm font-bold bg-[#29abe0] text-white px-3 py-1.5 rounded-lg hover:bg-[#1f87b2] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.061-4.3-.037-.046-.045-.085-.045-.085-.236-.874.05-1.744.5-2.074 1.015-.745 2.207-.538 3.168 1.547 1.25-1.954 2.239-2.311 3.237-1.541.52.394.908 1.18.665 2.144-.047.173-1.035 2.304-1.035 2.304z"/></svg>
                  Support
                </button>
              )}
              <button 
                onClick={() => signIn("google")}
                className="text-sm font-medium bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                Log in
              </button>
            </div>
          )}
        </div>
      </nav>
      {showDonateModal && <DonateModal onClose={() => setShowDonateModal(false)} />}
    </header>
  );
}

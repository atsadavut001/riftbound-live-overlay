"use client";

import { useSession, signIn, signOut } from "next-auth/react";

import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdminPanel = pathname?.startsWith("/admin");

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
                <a href="/overlapanal" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">
                  Overlay
                </a>
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
            <button 
              onClick={() => signIn("google")}
              className="text-sm font-medium bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              Log in
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import DonateModal from "./DonateModal";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdminPanel = pathname?.startsWith("/admin");
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showDecksDropdown, setShowDecksDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [cartCount, setCartCount] = useState(0);

  const fetchCart = async () => {
    if (!session?.user) return;
    try {
      const res = await fetch(`/api/cart?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const items = data?.items || [];
        const count = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
        setCartCount(count);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchCart();
    
    const handleCartUpdate = () => {
      fetchCart();
    };
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, [session?.user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDecksDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          <a href={pathname?.startsWith("/shop") ? "/shop" : "/"} className="text-xl font-bold text-[var(--primary)]">
            {pathname?.startsWith("/shop") ? "Riftbound Zberus Shop" : "Riftbound Overlay"}
          </a>
        </div>
        <div className={`flex items-center gap-6 ${pathname?.startsWith("/shop") ? "hidden md:flex" : ""}`}>
          {pathname?.startsWith("/shop") ? (
            <a href="/" className="text-sm font-medium bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors">
              กลับสู่หน้าหลัก Overlay
            </a>
          ) : !isAdminPanel && (
            <>
              <a href="/" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">Home</a>
              <a href="/shop" target="_blank" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">Shop</a>
              <a href="/cards" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">Card Library</a>
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setShowDecksDropdown(!showDecksDropdown)}
                  className="flex items-center gap-1 text-sm font-medium hover:text-[var(--primary)] transition-colors outline-none"
                >
                  Decks
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showDecksDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-40 bg-[#1a1a1a] border border-[#333] rounded-md shadow-xl py-1 z-50">
                    <a href="/decks" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#222] hover:text-white" onClick={() => setShowDecksDropdown(false)}>Decks Library</a>
                    {session?.user && (
                      <>
                        <a href="/decks/builder" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#222] hover:text-white" onClick={() => setShowDecksDropdown(false)}>Builder</a>
                        <a href="/decks/my-decks" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#222] hover:text-white" onClick={() => setShowDecksDropdown(false)}>My Decks</a>
                      </>
                    )}
                  </div>
                )}
              </div>
              <a href="/about" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">About us</a>
            </>
          )}
          
          {session?.user ? (
            <div className="flex items-center gap-4">
              {!isAdminPanel && !pathname?.startsWith("/shop") && (
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
                {!isAdminPanel && pathname?.startsWith("/shop") && !(session.user as any).isAdmin && (
                  <>
                    <a href="/shop/orders" className="text-sm font-medium text-gray-400 hover:text-[var(--primary)] transition-colors mr-4">
                      ประวัติการสั่งซื้อ
                    </a>
                    <a href="/shop/cart" className="text-gray-400 hover:text-[var(--primary)] transition-colors relative flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                      {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-[var(--primary)] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                          {cartCount > 99 ? '99+' : cartCount}
                        </span>
                      )}
                    </a>
                  </>
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
      
      {/* Mobile Bottom Navigation for Shop */}
      {pathname?.startsWith("/shop") && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111] border-t border-[#333] z-50 flex justify-around items-center h-16 px-2 pb-safe">
          {session?.user ? (
            <>
              <a href="/shop" className={`flex flex-col items-center justify-center w-1/4 ${pathname === "/shop" ? "text-[var(--primary)]" : "text-gray-400 hover:text-[var(--primary)]"}`}>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                <span className="text-[10px]">Home</span>
              </a>
              <a href="/shop/orders" className={`flex flex-col items-center justify-center w-1/4 ${pathname?.startsWith("/shop/orders") ? "text-[var(--primary)]" : "text-gray-400 hover:text-[var(--primary)]"}`}>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <span className="text-[10px]">ประวัติสั่งซื้อ</span>
              </a>
              <a href="/shop/cart" className={`flex flex-col items-center justify-center w-1/4 relative ${pathname?.startsWith("/shop/cart") ? "text-[var(--primary)]" : "text-gray-400 hover:text-[var(--primary)]"}`}>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                <span className="text-[10px]">ตะกร้า</span>
                {cartCount > 0 && (
                  <span className="absolute top-0 right-2 bg-[var(--primary)] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </a>
              <button onClick={() => signOut({ callbackUrl: "/shop" })} className="flex flex-col items-center justify-center text-red-400 hover:text-red-300 w-1/4">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                <span className="text-[10px]">Logout</span>
              </button>
            </>
          ) : (
            <button onClick={() => signIn("google", { callbackUrl: "/shop" })} className="flex flex-col items-center justify-center text-gray-400 hover:text-[var(--primary)] w-full py-2">
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
              <span className="text-[10px]">Login</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}

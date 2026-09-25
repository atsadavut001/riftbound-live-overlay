"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdminPanel = pathname?.startsWith("/admin");
  const [showDecksDropdown, setShowDecksDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 relative">
        <div className="flex items-center gap-4">
          <a href={pathname?.startsWith("/shop") ? "/shop" : "/"} className="text-xl font-bold text-[var(--primary)] hidden md:block">
            Zberus Rift Service
          </a>
          <a href="/" className="text-xl font-bold text-[var(--primary)] md:hidden">
            Zberus Rift Service
          </a>
        </div>
        
        {/* Mobile menu button */}
        {!pathname?.startsWith("/shop") && (
          <div className="md:hidden flex items-center" ref={mobileMenuRef}>
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="text-gray-300 hover:text-white p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            
            {showMobileMenu && (
              <div className="absolute top-full right-4 mt-2 w-56 bg-[#1a1a1a] border border-[#333] rounded-md shadow-xl py-2 z-50">
                {session?.user ? (
                  <>
                    <div className="px-4 py-2 flex items-center gap-2 border-b border-[#333] mb-2">
                      {session.user.image && <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full border border-gray-600" />}
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-white truncate">{session.user.name}</span>
                      </div>
                    </div>
                    {(session.user as any).isAdmin ? (
                      <>
                        <a href="/admin" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#222] hover:text-white" onClick={() => setShowMobileMenu(false)}>Admin Panel</a>
                        <a href="/shop" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#222] hover:text-white" onClick={() => setShowMobileMenu(false)}>Shop</a>
                        <a href="/cards" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#222] hover:text-white" onClick={() => setShowMobileMenu(false)}>Card Library</a>
                        <a href="/points-tracker" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#222] hover:text-white" onClick={() => setShowMobileMenu(false)}>Points Tracker</a>
                        <a href="/about" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#222] hover:text-white" onClick={() => setShowMobileMenu(false)}>About</a>
                        <a href="/overlapanal" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#222] hover:text-white" onClick={() => setShowMobileMenu(false)}>Overlay</a>
                        <button onClick={() => { setShowMobileMenu(false); signOut(); }} className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-[#222] hover:text-white">Log out</button>
                      </>
                    ) : (
                      <>
                        <a href="/shop" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#222] hover:text-white" onClick={() => setShowMobileMenu(false)}>Shop</a>
                        <a href="/cards" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#222] hover:text-white" onClick={() => setShowMobileMenu(false)}>Card Library</a>
                        <a href="/points-tracker" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#222] hover:text-white" onClick={() => setShowMobileMenu(false)}>Points Tracker</a>
                        <a href="/about" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#222] hover:text-white" onClick={() => setShowMobileMenu(false)}>About</a>
                        <a href="/overlapanal" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#222] hover:text-white" onClick={() => setShowMobileMenu(false)}>Overlay</a>
                        <button onClick={() => { setShowMobileMenu(false); signOut(); }} className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-[#222] hover:text-white">Log out</button>
                      </>
                    )}
                  </>
                ) : (
                  <button onClick={() => { setShowMobileMenu(false); signIn("google"); }} className="w-full text-left block px-4 py-2 text-sm text-white hover:bg-[#222]">Log in</button>
                )}
              </div>
            )}
          </div>
        )}

        <div className={`hidden md:flex items-center gap-6`}>
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
              <a href="/points-tracker" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">Points Tracker</a>
              <a href="/about" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">About us</a>
            </>
          )}
          
          {session?.user ? (
            <div className="hidden md:flex items-center gap-4">
              {!isAdminPanel && !pathname?.startsWith("/shop") && (
                <>
                  <a href="/overlapanal" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">
                    Overlay
                  </a>
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
            <div className="hidden md:flex items-center gap-4">
              {/* Support button removed */}
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

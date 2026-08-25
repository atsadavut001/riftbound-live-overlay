"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated" && !(session?.user as any)?.isAdmin) {
      router.push("/overlapanal");
    }
  }, [status, session, router]);

  if (status === "loading" || !session) {
    return <div className="p-8 text-center text-gray-400 flex-1">Loading admin panel...</div>;
  }

  const menuItems = [
    { name: "Card", path: "/admin/card" },
    { name: "User", path: "/admin/user" },
    { name: "Issue", path: "/admin/issue" },
  ];

  return (
    <div className="flex flex-1 w-full max-w-7xl mx-auto border-x border-[var(--border)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--border)] bg-[var(--surface)] shrink-0 hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-lg font-bold text-[#f59e0b] uppercase tracking-wider">Admin Panel</h2>
        </div>
        <nav className="flex-1 flex flex-col gap-2 px-4 pb-6">
          {menuItems.map((item) => {
            const isActive = pathname?.startsWith(item.path) || (item.path === '/admin/card' && pathname === '/admin');
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-[var(--primary)] text-white shadow-md" 
                    : "text-gray-400 hover:text-white hover:bg-[#222]"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#0a0a0a] p-8">
        {children}
      </main>
    </div>
  );
}

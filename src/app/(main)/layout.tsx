import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] text-center py-4 text-sm text-gray-400">
        © 2026 Riftbound Live Overlay
      </footer>
    </AuthProvider>
  );
}

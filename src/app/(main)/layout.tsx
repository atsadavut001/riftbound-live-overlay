import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="flex-1 flex flex-col min-h-0">
        {children}
      </main>
      <Footer />
    </AuthProvider>
  );
}

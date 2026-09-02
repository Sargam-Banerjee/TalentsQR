"use client";

import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-[var(--background)]">
        <Sidebar />
        <main className="flex-1 lg:ml-0">
          <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}

"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Footer } from "./Footer";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell relative h-screen flex overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-72 md:flex-col">
        <Sidebar />
      </aside>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar */}
          <aside className="fixed inset-y-0 left-0 z-50 w-72 md:hidden">
            <Sidebar />
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="content-wrap">
            {children}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

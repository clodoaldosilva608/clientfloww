import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileNav";
import ErrorBoundary from "./ErrorBoundary";

import { CommandMenu } from "./CommandMenu";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  
  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden" id="app-layout-root">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <main className="flex-1 overflow-auto relative bg-[#09090b]" id="main-content">
        <div className="sticky top-0 z-50 p-4 md:hidden bg-background/80 backdrop-blur-md border-b border-white/5">
           <CommandMenu />
        </div>
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 bg-zinc-950/50">
          <div className="hidden md:block mb-8 max-w-sm ml-auto">
             <CommandMenu />
          </div>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
        <MobileBottomNav />
      </main>
    </div>
  );
}

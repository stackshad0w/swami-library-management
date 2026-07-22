"use client";

import { useState } from "react";
import { AppSidebar } from "./sidebar";
import { Menu, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/command-palette";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  reminderCount?: number;
  institutionName?: string;
  adminName?: string;
  userEmail?: string;
}

export function AppShell({
  children,
  reminderCount = 0,
  institutionName,
  adminName,
  userEmail,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <AppSidebar
          reminderCount={reminderCount}
          institutionName={institutionName}
          adminName={adminName}
          userEmail={userEmail}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <AppSidebar
          reminderCount={reminderCount}
          institutionName={institutionName}
          adminName={adminName}
          userEmail={userEmail}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span className="font-heading font-bold text-sm flex-1 truncate">
            Swami Abhyasika
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCmdOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}

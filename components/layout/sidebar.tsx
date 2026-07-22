"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  BookOpen,
  Building2,
  CreditCard,
  Bell,
  BarChart3,
  Download,
  Settings,
  LogOut,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  soon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/new-admission", label: "New Admission", icon: UserPlus },
  { href: "/basement-library", label: "Basement Library", icon: BookOpen },
  { href: "/2nd-floor-library", label: "2nd Floor Library", icon: Building2, soon: true },
  { href: "/fee-management", label: "Fee Management", icon: CreditCard },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/export-data", label: "Export Data", icon: Download },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  reminderCount?: number;
  institutionName?: string;
  adminName?: string;
  userEmail?: string;
}

export function AppSidebar({
  reminderCount = 0,
  institutionName = "Swami Abhyasika",
  adminName = "Admin",
  userEmail = "",
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <aside className="flex h-full flex-col w-64 border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-sidebar-foreground font-heading truncate leading-tight">
            {institutionName}
          </p>
          <p className="text-xs text-muted-foreground">Student Manager</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.soon ? "#" : item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 flex-shrink-0 transition-colors",
                  isActive ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.label === "Reminders" && reminderCount > 0 && (
                <Badge className="h-5 min-w-5 px-1.5 text-xs bg-red-500 text-white hover:bg-red-500">
                  {reminderCount}
                </Badge>
              )}
              {item.soon && (
                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Soon
                </span>
              )}
              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-sidebar-primary opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Admin Card */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {adminName}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

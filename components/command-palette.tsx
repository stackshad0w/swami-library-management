"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  BookOpen,
  CreditCard,
  Bell,
  BarChart3,
  Download,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTIONS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "New Admission", href: "/new-admission", icon: UserPlus },
  { label: "Basement Library", href: "/basement-library", icon: BookOpen },
  { label: "Fee Management", href: "/fee-management", icon: CreditCard },
  { label: "Reminders", href: "/reminders", icon: Bell },
  { label: "Statistics", href: "/statistics", icon: BarChart3 },
  { label: "Export Data", href: "/export-data", icon: Download },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [students, setStudents] = useState<
    { id: string; name: string; student_id: string; course: string }[]
  >([]);

  // Ctrl+K listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const fetchStudents = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("students")
      .select("id, name, student_id, course")
      .limit(50);
    if (data) setStudents(data);
  }, []);

  useEffect(() => {
    if (open) fetchStudents();
  }, [open, fetchStudents]);

  const go = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search students, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <CommandItem
                key={action.href}
                onSelect={() => go(action.href)}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {action.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
        {students.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Students">
              {students.map((s) => (
                <CommandItem
                  key={s.id}
                  onSelect={() => go(`/students?id=${s.id}`)}
                  className="cursor-pointer"
                >
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {s.student_id} · {s.course}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

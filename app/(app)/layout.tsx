import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch settings for sidebar
  const { data: settings } = await supabase
    .from("app_settings")
    .select("institution_name, institution_admin_name, reminder_days_before, overdue_days_threshold")
    .single();

  // Count reminders (students with fee_due_date within reminder_days_before or overdue)
  const reminderDays = settings?.reminder_days_before ?? 5;
  const today = new Date().toISOString().split("T")[0];
  const futureDate = new Date(Date.now() + reminderDays * 86400000)
    .toISOString()
    .split("T")[0];

  const { count } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .or(
      `fee_status.eq.Overdue,and(fee_due_date.gte.${today},fee_due_date.lte.${futureDate})`
    )
    .eq("is_active", true);

  return (
    <AppShell
      reminderCount={count ?? 0}
      institutionName={settings?.institution_name ?? "Swami Abhyasika"}
      adminName={settings?.institution_admin_name ?? "Admin"}
      userEmail={user.email ?? ""}
    >
      {children}
    </AppShell>
  );
}

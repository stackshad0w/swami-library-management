import { createServerSupabaseClient } from "@/lib/supabase/client";
import { FeeManagementTable } from "@/components/fees/fee-management-table";
import type { Student } from "@/lib/types";

export const metadata = {
  title: "Fee Management — Swami Abhyasika",
};

export default async function FeeManagementPage() {
  const supabase = await createServerSupabaseClient();

  const [{ data: students }, { data: coursesData }] = await Promise.all([
    supabase
      .from("students")
      .select("*")
      .order("fee_status")
      .order("fee_due_date"),
    supabase.from("courses").select("name").order("sort_order"),
  ]);

  const courses = coursesData?.map((c) => c.name) ?? [];

  // Summary counts
  const all = students ?? [];
  const active = all.filter((s) => s.fee_status === "Active").length;
  const overdue = all.filter((s) => s.fee_status === "Overdue").length;
  const inactive = all.filter((s) => s.fee_status === "Inactive").length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-heading">Fee Management</h1>
        <p className="text-muted-foreground mt-1">
          Record and track student fee payments
        </p>
      </div>

      {/* Summary Badges */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: "Total", value: all.length, cls: "bg-muted" },
          { label: "Active", value: active, cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
          { label: "Overdue", value: overdue, cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
          { label: "Inactive", value: inactive, cls: "bg-red-500/15 text-red-500" },
        ].map((s) => (
          <div
            key={s.label}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${s.cls}`}
          >
            <span>{s.label}</span>
            <span className="font-bold">{s.value}</span>
          </div>
        ))}
      </div>

      <FeeManagementTable students={all as Student[]} courses={courses} />
    </div>
  );
}

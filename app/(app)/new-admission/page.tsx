import { createServerSupabaseClient } from "@/lib/supabase/client";
import { StudentForm } from "@/components/students/student-form";
import type { Course, FeeTier } from "@/lib/types";

export const metadata = {
  title: "New Admission — Swami Abhyasika",
};

export default async function NewAdmissionPage() {
  const supabase = await createServerSupabaseClient();

  const [{ data: courses }, { data: feeTiers }, { count }] = await Promise.all([
    supabase.from("courses").select("*").order("sort_order"),
    supabase.from("fee_tiers").select("*"),
    supabase.from("students").select("*", { count: "exact", head: true }),
  ]);

  const nextSeq = (count ?? 0) + 1;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-heading">New Admission</h1>
        <p className="text-muted-foreground mt-1">
          Enroll a new student — ID will be auto-assigned as{" "}
          <code className="text-primary font-mono text-sm">
            STU-{String(nextSeq).padStart(4, "0")}
          </code>
        </p>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card p-6">
        <StudentForm
          courses={(courses ?? []) as Course[]}
          feeTiers={(feeTiers ?? []) as FeeTier[]}
          nextSeq={nextSeq}
        />
      </div>
    </div>
  );
}

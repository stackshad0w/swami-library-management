import { createServerSupabaseClient } from "@/lib/supabase/client";
import { notFound } from "next/navigation";
import { StudentForm } from "@/components/students/student-form";
import type { Course, FeeTier, Student } from "@/lib/types";

export const metadata = {
  title: "Edit Student — Swami Abhyasika",
};

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const [{ data: student }, { data: courses }, { data: feeTiers }] = await Promise.all([
    supabase.from("students").select("*").eq("id", id).single(),
    supabase.from("courses").select("*").order("sort_order"),
    supabase.from("fee_tiers").select("*"),
  ]);

  if (!student) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-heading">Edit Student</h1>
        <p className="text-muted-foreground mt-1">
          Editing: <strong>{student.name}</strong> ({student.student_id})
        </p>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card p-6">
        <StudentForm
          student={student as Student}
          courses={(courses ?? []) as Course[]}
          feeTiers={(feeTiers ?? []) as FeeTier[]}
        />
      </div>
    </div>
  );
}

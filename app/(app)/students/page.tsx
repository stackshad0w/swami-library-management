import { createServerSupabaseClient } from "@/lib/supabase/client";
import { StudentTable } from "@/components/students/student-table";
import { Button } from "@/components/ui/button";
import { UserPlus, Search } from "lucide-react";
import Link from "next/link";
import type { Student } from "@/lib/types";

export const metadata = {
  title: "Students — Swami Abhyasika",
};

export default async function StudentsPage() {
  const supabase = await createServerSupabaseClient();

  const [{ data: students }, { data: coursesData }] = await Promise.all([
    supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("courses").select("name").order("sort_order"),
  ]);

  const courses = coursesData?.map((c) => c.name) ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">Students</h1>
          <p className="text-muted-foreground mt-1">
            {students?.length ?? 0} total enrolled students
          </p>
        </div>
        <Link href="/new-admission">
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            New Admission
          </Button>
        </Link>
      </div>

      <StudentTable students={(students ?? []) as Student[]} courses={courses} />
    </div>
  );
}

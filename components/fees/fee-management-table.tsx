"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, CreditCard, Phone } from "lucide-react";
import type { Student } from "@/lib/types";
import {
  formatDate,
  formatCurrency,
  getFeeStatusColor,
  getDaysUntilDue,
} from "@/lib/utils";
import { PaymentModal } from "@/components/fees/payment-modal";

interface FeeManagementTableProps {
  students: Student[];
  courses: string[];
}

export function FeeManagementTable({ students, courses }: FeeManagementTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payingStudent, setPayingStudent] = useState<Student | null>(null);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.student_id.toLowerCase().includes(q) ||
      s.phone.includes(q);
    const matchCourse = courseFilter === "all" || s.course === courseFilter;
    const matchStatus = statusFilter === "all" || s.fee_status === statusFilter;
    return matchSearch && matchCourse && matchStatus;
  });

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={courseFilter} onValueChange={(v) => { if (v) setCourseFilter(v); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        {filtered.length} of {students.length} students
      </p>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">No students found</p>
        ) : (
          filtered.map((student) => {
            const daysLeft = getDaysUntilDue(student.fee_due_date);
            const balance = Math.max(0, student.total_fees - student.paid_fees);
            return (
              <div
                key={student.id}
                className="flex items-center gap-4 rounded-xl border border-border/50 bg-card px-4 py-3.5 hover:bg-muted/20 transition-colors"
              >
                {/* Avatar */}
                <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                  {student.photo_url ? (
                    <img src={student.photo_url!} alt={student.name} className="object-cover w-full h-full" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary text-sm font-bold">
                      {student.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{student.name}</p>
                    <Badge className={`text-xs ${getFeeStatusColor(student.fee_status)}`}>
                      {student.fee_status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <span>{student.student_id}</span>
                    <span>·</span>
                    <Phone className="h-3 w-3" />
                    <span>{student.phone}</span>
                    <span>·</span>
                    <span>{student.course}</span>
                  </p>
                </div>

                {/* Fee Info */}
                <div className="hidden md:flex flex-col items-end gap-0.5">
                  <p className="text-sm font-medium">
                    {formatCurrency(student.paid_fees)} / {formatCurrency(student.total_fees)}
                  </p>
                  {balance > 0 && (
                    <p className="text-xs text-amber-500">Balance: {formatCurrency(balance)}</p>
                  )}
                </div>

                {/* Due Date */}
                <div className="hidden lg:flex flex-col items-end gap-0.5 w-28">
                  <p className="text-xs text-muted-foreground">Due date</p>
                  <p className={`text-sm font-medium ${daysLeft < 0 ? "text-red-500" : daysLeft <= 5 ? "text-amber-500" : ""}`}>
                    {formatDate(student.fee_due_date)}
                  </p>
                  {daysLeft < 0 && (
                    <p className="text-xs text-red-500">{Math.abs(daysLeft)}d overdue</p>
                  )}
                  {daysLeft >= 0 && daysLeft <= 5 && (
                    <p className="text-xs text-amber-500">{daysLeft}d left</p>
                  )}
                </div>

                {/* Action */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPayingStudent(student)}
                  className="gap-2 flex-shrink-0"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Record</span>
                </Button>
              </div>
            );
          })
        )}
      </div>

      {payingStudent && (
        <PaymentModal
          student={payingStudent}
          onClose={() => setPayingStudent(null)}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </>
  );
}

"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Student, Shift, PaymentMethod } from "@/lib/types";

interface PaymentReceiptProps {
  student: Student;
  amount: number;
  date: string;
  method: PaymentMethod;
  nextDueDate: string;
  months: number;
  shift: Shift;
}

export function PaymentReceipt({
  student,
  amount,
  date,
  method,
  nextDueDate,
  months,
  shift,
}: PaymentReceiptProps) {
  const handlePrint = () => window.print();

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 print:shadow-none">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold font-heading text-sm">Swami Abhyasika</p>
          <p className="text-xs text-muted-foreground">Payment Receipt</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        {[
          ["Receipt Date", formatDate(date)],
          ["Student Name", student.name],
          ["Student ID", student.student_id],
          ["Course", student.course],
          ["Shift", shift],
          ["Months", `${months} month(s)`],
          ["Payment Method", method],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Amount Paid</span>
        <span className="text-2xl font-bold text-primary font-heading">
          {formatCurrency(amount)}
        </span>
      </div>

      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-center">
        <p className="text-xs text-muted-foreground">Next Due Date</p>
        <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
          {formatDate(nextDueDate)}
        </p>
      </div>

      <Button variant="outline" size="sm" onClick={handlePrint} className="w-full gap-2 print:hidden">
        <Printer className="h-4 w-4" />
        Print Receipt
      </Button>
    </div>
  );
}

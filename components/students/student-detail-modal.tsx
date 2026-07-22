"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  BookOpen,
  CreditCard,
  Clock,
  User,
} from "lucide-react";
import type { Student, Payment } from "@/lib/types";
import {
  formatDate,
  formatCurrency,
  getFeeStatusColor,
  getRemainingBalance,
} from "@/lib/utils";

interface StudentDetailModalProps {
  student: Student;
  onClose: () => void;
}

export function StudentDetailModal({ student, onClose }: StudentDetailModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("payment_history")
        .select("*")
        .eq("student_id", student.id)
        .order("payment_date", { ascending: false });
      setPayments(data ?? []);
      setLoading(false);
    };
    fetchPayments();
  }, [student.id]);

  const balance = getRemainingBalance(student);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="h-full max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="font-heading text-xl">Student Profile</DialogTitle>
            </DialogHeader>

            {/* Profile Header */}
            <div className="flex items-start gap-5 mb-6">
              <div className="relative h-20 w-20 rounded-2xl overflow-hidden flex-shrink-0">
                {student.photo_url ? (
                  <Image src={student.photo_url} alt={student.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary text-2xl font-bold">
                    {student.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h2 className="text-xl font-bold font-heading">{student.name}</h2>
                    <p className="text-sm text-muted-foreground">{student.student_id}</p>
                  </div>
                  <Badge className={getFeeStatusColor(student.fee_status)}>
                    {student.fee_status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {student.phone}
                  </span>
                  {student.email && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {student.email}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    {student.gender}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="mb-5" />

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { icon: BookOpen, label: "Course", value: student.course },
                { icon: Clock, label: "Shift", value: student.shift },
                { icon: Calendar, label: "Admission", value: formatDate(student.admission_date) },
                { icon: Calendar, label: "Due Date", value: formatDate(student.fee_due_date) },
                { icon: CreditCard, label: "Total Fees", value: formatCurrency(student.total_fees) },
                { icon: CreditCard, label: "Paid", value: formatCurrency(student.paid_fees) },
                { icon: CreditCard, label: "Balance", value: formatCurrency(balance), highlight: balance > 0 },
                { icon: Clock, label: "Months", value: `${student.subscription_months ?? 0} month(s)` },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className={`text-sm font-medium ${item.highlight ? "text-amber-500" : ""}`}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {student.address && (
              <div className="flex items-start gap-2 mb-5">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">{student.address}</p>
                </div>
              </div>
            )}

            {student.conditions && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 mb-5">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">Conditions / Remarks</p>
                <p className="text-sm">{student.conditions}</p>
              </div>
            )}

            <Separator className="mb-5" />

            {/* Payment History */}
            <h3 className="font-heading font-bold text-base mb-3">Payment History</h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments recorded.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{formatCurrency(p.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.payment_date)} · {p.method} · {p.months} month(s)
                      </p>
                      {p.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">{p.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {p.shift}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {formatDate(p.next_due_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

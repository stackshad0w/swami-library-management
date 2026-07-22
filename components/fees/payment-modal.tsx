"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/server";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2 } from "lucide-react";
import type { Student, Shift, PaymentMethod } from "@/lib/types";
import { formatCurrency, formatDate, calculateNextDueDate } from "@/lib/utils";
import { format } from "date-fns";
import { PaymentReceipt } from "./payment-receipt";

interface PaymentModalProps {
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash", "UPI", "Online Transfer", "Cheque", "Demand Draft", "Card", "Free",
];

const MONTHS_OPTIONS = [1, 2, 3, 6, 12];

export function PaymentModal({ student, onClose, onSuccess }: PaymentModalProps) {
  const [amount, setAmount] = useState<number>(student.total_fees - student.paid_fees);
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [fromDate, setFromDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [months, setMonths] = useState(1);
  const [shift, setShift] = useState<Shift>(student.shift);
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<null | {
    student: Student;
    amount: number;
    date: string;
    method: PaymentMethod;
    nextDueDate: string;
    months: number;
    shift: Shift;
  }>(null);

  const nextDueDate = format(
    calculateNextDueDate(new Date(fromDate), months),
    "yyyy-MM-dd"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error("Amount must be greater than 0.");
      return;
    }
    setLoading(true);
    const supabase = createClient();

    const { error: payErr } = await supabase.from("payment_history").insert({
      student_id: student.id,
      amount,
      payment_date: paymentDate,
      from_date: fromDate,
      months,
      next_due_date: nextDueDate,
      shift,
      method,
      notes: notes || null,
    });

    if (payErr) {
      toast.error(payErr.message);
      setLoading(false);
      return;
    }

    // Update student paid_fees and due date
    const { error: updateErr } = await supabase
      .from("students")
      .update({
        paid_fees: student.paid_fees + amount,
        fee_due_date: nextDueDate,
        subscription_months: months,
        fee_status: "Active",
        shift,
      })
      .eq("id", student.id);

    setLoading(false);
    if (updateErr) {
      toast.error(updateErr.message);
      return;
    }

    setReceipt({
      student,
      amount,
      date: paymentDate,
      method,
      nextDueDate,
      months,
      shift,
    });
    onSuccess();
  };

  if (receipt) {
    return (
      <Dialog open onOpenChange={() => { setReceipt(null); onClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
              Payment Recorded!
            </DialogTitle>
          </DialogHeader>
          <PaymentReceipt {...receipt} />
          <Button onClick={() => { setReceipt(null); onClose(); }} className="w-full mt-2">
            Done
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Record Payment</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {student.name} · {student.student_id}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={1}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="from_date">From Date</Label>
              <Input
                id="from_date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Months Subscribed</Label>
              <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS_OPTIONS.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} {m === 1 ? "Month" : "Months"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Next Due Date (calculated) */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-2.5">
            <p className="text-xs text-muted-foreground">Next Due Date (auto-calculated)</p>
            <p className="font-semibold text-primary">{formatDate(nextDueDate)}</p>
          </div>

          {/* Shift */}
          <div>
            <Label className="mb-2 block">Study Shift</Label>
            <RadioGroup
              value={shift}
              onValueChange={(v) => setShift(v as Shift)}
              className="flex gap-5"
            >
              {(["Day", "Night", "Both"] as Shift[]).map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <RadioGroupItem value={s} id={`shift-${s}`} />
                  <Label htmlFor={`shift-${s}`} className="font-normal cursor-pointer">{s}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Payment Method */}
          <div>
            <Label>Payment Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any remarks..."
              className="mt-1"
            />
          </div>

          <Separator />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Recording...
              </span>
            ) : (
              `Record ${formatCurrency(amount)}`
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

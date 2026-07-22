import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInDays, addMonths } from "date-fns";
import type { FeeStatus, Student } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatStudentId(seq: number): string {
  return `STU-${String(seq).padStart(4, "0")}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  try {
    return format(new Date(date), "dd MMM yyyy");
  } catch {
    return "—";
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  try {
    return format(new Date(date), "dd MMM yyyy, hh:mm a");
  } catch {
    return "—";
  }
}

export function calculateNextDueDate(fromDate: Date, months: number): Date {
  return addMonths(fromDate, months);
}

export function computeFeeStatus(
  feeDueDate: string | null | undefined,
  overdueDaysThreshold = 7
): FeeStatus {
  if (!feeDueDate) return "Inactive";
  const today = new Date();
  const due = new Date(feeDueDate);
  const diff = differenceInDays(due, today);
  if (diff > 0) return "Active";
  if (diff >= -overdueDaysThreshold) return "Overdue";
  return "Inactive";
}

export function getDaysUntilDue(feeDueDate: string | null | undefined): number {
  if (!feeDueDate) return -9999;
  const today = new Date();
  const due = new Date(feeDueDate);
  return differenceInDays(due, today);
}

export function getRemainingBalance(student: Student): number {
  return Math.max(0, student.total_fees - student.paid_fees);
}

export function buildWhatsAppUrl(
  phone: string,
  template: string,
  vars: Record<string, string>
): string {
  let msg = template;
  for (const [k, v] of Object.entries(vars)) {
    msg = msg.replaceAll(`{${k}}`, v);
  }
  const cleaned = phone.replace(/\D/g, "");
  const num = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "₹0";
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function getFeeStatusColor(status: FeeStatus): string {
  switch (status) {
    case "Active":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
    case "Overdue":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
    case "Inactive":
      return "bg-red-500/15 text-red-500 dark:text-red-400";
    case "Expired":
      return "bg-gray-500/15 text-gray-500";
    default:
      return "bg-gray-500/15 text-gray-500";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(fn: T, ms = 300) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ─── Student ─────────────────────────────────────────────────────────────────

export type Gender = "Male" | "Female" | "Other";
export type Shift = "Day" | "Night" | "Both";
export type FeeStatus = "Active" | "Overdue" | "Inactive" | "Expired";
export type PaymentMethod =
  | "Cash"
  | "UPI"
  | "Online Transfer"
  | "Cheque"
  | "Demand Draft"
  | "Card"
  | "Free";

export interface Student {
  id: string; // UUID
  student_id: string; // STU-0001
  name: string;
  phone: string;
  email?: string | null;
  gender: Gender;
  address?: string | null;
  photo_url?: string | null;
  conditions?: string | null;
  course: string;
  shift: Shift;
  admission_date: string; // ISO date
  fee_due_date?: string | null; // ISO date
  subscription_months?: number | null;
  total_fees: number;
  paid_fees: number;
  fee_status: FeeStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentWithPayments extends Student {
  payments: Payment[];
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string; // ISO date
  from_date: string; // ISO date
  months: number;
  next_due_date: string; // ISO date
  shift: Shift;
  method: PaymentMethod;
  notes?: string | null;
  created_at: string;
}

// ─── Seat Bookings ────────────────────────────────────────────────────────────

export type BookingStatus = "Active" | "Expired" | "Cancelled";

export interface TimeSlot {
  label: string;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

export interface SeatBooking {
  id: string;
  seat_number: number; // 1–84
  student_id: string;
  booking_date: string; // ISO date
  slots: TimeSlot[];
  fee: number;
  payment_method: PaymentMethod;
  status: BookingStatus;
  created_at: string;
  student?: Pick<Student, "name" | "phone" | "student_id" | "course">;
}

// ─── Fee Tiers ────────────────────────────────────────────────────────────────

export interface FeeTier {
  id: string;
  gender: Gender | "All";
  shift: Shift;
  months: number;
  fee: number;
}

// ─── Cash Closing ─────────────────────────────────────────────────────────────

export type CashClosingStatus = "Open" | "Closed";

export interface CashClosing {
  id: string;
  closing_date: string; // ISO date
  opening_cash: number;
  cash_collected: number;
  upi_online_total: number;
  actual_closing_cash: number;
  difference: number;
  closed_by: string;
  notes?: string | null;
  status: CashClosingStatus;
  created_at: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface InstitutionProfile {
  name: string;
  admin_name: string;
  phone: string;
  email: string;
  address: string;
}

export interface AppSettings {
  reminder_days_before: number;      // days before due date to show reminder
  overdue_days_threshold: number;    // days overdue before marking inactive
  owner_pin: string;                 // 4-6 digit PIN for delete approval
  theme: "dark" | "light" | "system";
  accent_color: "purple" | "blue" | "green" | "amber" | "red" | "violet";
  font_size: "small" | "medium" | "large";
  institution: InstitutionProfile;
  whatsapp_template_overdue: string;
  whatsapp_template_upcoming: string;
}

// ─── Course ───────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  name: string;
  sort_order: number;
}

// ─── WhatsApp Template ────────────────────────────────────────────────────────

export interface WhatsAppTemplate {
  id: string;
  name: string;
  template: string;
}

// ─── Pending Delete ───────────────────────────────────────────────────────────

export interface PendingDelete {
  id: string;
  student_id: string;
  student_name: string;
  requested_at: string;
  status: "Pending" | "Approved" | "Rejected";
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export type StatPeriod =
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "last_6_months"
  | "this_year"
  | "all_time";

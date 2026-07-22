import { createServerSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  CreditCard,
  AlertCircle,
  BookOpen,
  TrendingUp,
  Clock,
  ArrowRight,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { formatDate, formatCurrency, getDaysUntilDue, getFeeStatusColor } from "@/lib/utils";
import type { Student, Payment } from "@/lib/types";
import { format, startOfMonth } from "date-fns";

export const metadata = {
  title: "Dashboard — Swami Abhyasika",
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const [
    { data: students },
    { data: overdueStudents },
    { data: recentPayments },
    { data: todayBookings, count: bookingCount },
    { data: monthPayments },
  ] = await Promise.all([
    supabase.from("students").select("*").order("created_at", { ascending: false }),
    supabase
      .from("students")
      .select("*")
      .eq("fee_status", "Overdue")
      .order("fee_due_date")
      .limit(5),
    supabase
      .from("payment_history")
      .select("*, student:students(name, student_id)")
      .order("payment_date", { ascending: false })
      .limit(6),
    supabase
      .from("seat_bookings")
      .select("*", { count: "exact" })
      .eq("booking_date", today)
      .eq("status", "Active"),
    supabase
      .from("payment_history")
      .select("amount")
      .gte("payment_date", monthStart),
  ]);

  const allStudents = (students ?? []) as Student[];
  const totalStudents = allStudents.length;
  const activeStudents = allStudents.filter((s) => s.fee_status === "Active").length;
  const overdueCount = allStudents.filter((s) => s.fee_status === "Overdue").length;
  const inactiveCount = allStudents.filter((s) => s.fee_status === "Inactive").length;
  const monthlyRevenue = (monthPayments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const pendingFees = allStudents.reduce(
    (s, st) => s + Math.max(0, st.total_fees - st.paid_fees),
    0
  );

  // New students this month
  const newThisMonth = allStudents.filter(
    (s) => s.admission_date >= monthStart
  ).length;

  const statCards = [
    {
      label: "Total Students",
      value: totalStudents,
      sub: `${activeStudents} active`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/students",
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(monthlyRevenue),
      sub: `${(monthPayments ?? []).length} payments this month`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      href: "/statistics",
    },
    {
      label: "Overdue Fees",
      value: overdueCount,
      sub: `${formatCurrency(pendingFees)} total pending`,
      icon: AlertCircle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      href: "/reminders",
    },
    {
      label: "Library Today",
      value: bookingCount ?? 0,
      sub: `${84 - (bookingCount ?? 0)} seats available`,
      icon: BookOpen,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/basement-library",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening today,{" "}
            <span className="text-foreground font-medium">
              {format(new Date(), "EEEE dd MMM yyyy")}
            </span>
          </p>
        </div>
        <Link href="/new-admission">
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            New Admission
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card className="border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bg}`}>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                  <p className="text-2xl font-bold font-heading">{card.value}</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{card.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Status Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active", value: activeStudents, cls: "text-emerald-500 bg-emerald-500/10" },
          { label: "Overdue", value: overdueCount, cls: "text-amber-500 bg-amber-500/10" },
          { label: "Inactive", value: inactiveCount, cls: "text-red-500 bg-red-500/10" },
          { label: "New This Month", value: newThisMonth, cls: "text-blue-500 bg-blue-500/10" },
        ].map((item) => (
          <div
            key={item.label}
            className={`flex items-center justify-between rounded-xl border border-border/50 px-4 py-3 ${item.cls}`}
          >
            <span className="text-sm font-medium opacity-80">{item.label}</span>
            <span className="text-2xl font-bold font-heading">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Bottom Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Students */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Needs Attention
            </CardTitle>
            <Link href="/reminders">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {!overdueStudents?.length ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <p className="text-sm font-medium">All clear!</p>
                <p className="text-xs text-muted-foreground">No overdue students</p>
              </div>
            ) : (
              (overdueStudents as Student[]).map((student) => {
                const daysLeft = getDaysUntilDue(student.fee_due_date);
                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold flex-shrink-0">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {student.phone}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">{formatDate(student.fee_due_date)}</p>
                      <p className="text-xs font-medium text-red-500">
                        {Math.abs(daysLeft)}d overdue
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              Recent Payments
            </CardTitle>
            <Link href="/fee-management">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {!recentPayments?.length ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Clock className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No payments yet</p>
              </div>
            ) : (
              (recentPayments as (Payment & { student: { name: string; student_id: string } | null })[]).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold flex-shrink-0">
                    {payment.student?.name?.charAt(0) ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{payment.student?.name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{payment.student?.student_id} · {payment.method}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(payment.payment_date)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold font-heading mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: "/new-admission", label: "Enroll Student", icon: UserPlus, color: "text-primary" },
            { href: "/basement-library", label: "Book a Seat", icon: BookOpen, color: "text-blue-500" },
            { href: "/reminders", label: "Send Reminders", icon: Clock, color: "text-amber-500" },
            { href: "/statistics", label: "View Reports", icon: TrendingUp, color: "text-emerald-500" },
            { href: "/export-data", label: "Export Data", icon: CreditCard, color: "text-violet-500" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Button variant="outline" className="gap-2 h-10">
                  <Icon className={`h-4 w-4 ${action.color}`} />
                  {action.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

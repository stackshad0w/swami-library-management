"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Users,
  UserPlus,
  CreditCard,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import type { StatPeriod, Student, Payment } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { format, subMonths, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { toast } from "sonner";

const PERIOD_OPTIONS: { label: string; value: StatPeriod }[] = [
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "Last 3 Months", value: "last_3_months" },
  { label: "Last 6 Months", value: "last_6_months" },
  { label: "This Year", value: "this_year" },
  { label: "All Time", value: "all_time" },
];

const CHART_COLORS = [
  "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899",
];

function getPeriodRange(period: StatPeriod): { from: string | null; to: string | null } {
  const now = new Date();
  switch (period) {
    case "this_month":
      return {
        from: format(startOfMonth(now), "yyyy-MM-dd"),
        to: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    case "last_month": {
      const last = subMonths(now, 1);
      return {
        from: format(startOfMonth(last), "yyyy-MM-dd"),
        to: format(endOfMonth(last), "yyyy-MM-dd"),
      };
    }
    case "last_3_months":
      return { from: format(subMonths(now, 3), "yyyy-MM-dd"), to: null };
    case "last_6_months":
      return { from: format(subMonths(now, 6), "yyyy-MM-dd"), to: null };
    case "this_year":
      return { from: format(startOfYear(now), "yyyy-MM-dd"), to: null };
    case "all_time":
    default:
      return { from: null, to: null };
  }
}

export default function StatisticsPage() {
  const supabase = createClient();
  const [period, setPeriod] = useState<StatPeriod>("this_month");
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  // Cash closing
  const [openingCash, setOpeningCash] = useState(0);
  const [cashCollected, setCashCollected] = useState(0);
  const [actualClosing, setActualClosing] = useState(0);
  const [closedBy, setClosedBy] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [closingHistory, setClosingHistory] = useState<any[]>([]);
  const [closingLoading, setClosingLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { from, to } = getPeriodRange(period);
      const [{ data: allStu }, { data: payData }, { data: closings }] = await Promise.all([
        supabase.from("students").select("*"),
        (() => {
          let q = supabase.from("payment_history").select("*").order("payment_date");
          if (from) q = q.gte("payment_date", from);
          if (to) q = q.lte("payment_date", to);
          return q;
        })(),
        supabase.from("cash_closings").select("*").order("closing_date", { ascending: false }).limit(30),
      ]);

      setAllStudents((allStu ?? []) as Student[]);
      setPayments((payData ?? []) as Payment[]);
      setClosingHistory(closings ?? []);

      // Filter students by period
      if (from) {
        setStudents((allStu ?? []).filter((s) => s.admission_date >= from) as Student[]);
      } else {
        setStudents((allStu ?? []) as Student[]);
      }
    };
    fetchData();
  }, [period]);

  const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);
  const pendingFees = allStudents.reduce((s, st) => s + Math.max(0, st.total_fees - st.paid_fees), 0);
  const overdue = allStudents.filter((s) => s.fee_status === "Overdue").length;

  // Chart data
  const courseData = Object.entries(
    allStudents.reduce((acc, s) => {
      acc[s.course] = (acc[s.course] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const methodData = Object.entries(
    payments.reduce((acc, p) => {
      acc[p.method] = (acc[p.method] ?? 0) + Number(p.amount);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const pieData = [
    { name: "Collected", value: totalCollected },
    { name: "Pending", value: pendingFees },
  ];

  // Monthly revenue (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const monthStr = format(d, "yyyy-MM");
    const revenue = payments
      .filter((p) => p.payment_date.startsWith(monthStr))
      .reduce((s, p) => s + Number(p.amount), 0);
    return { month: format(d, "MMM"), revenue };
  });

  const handleCashClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closedBy) { toast.error("Enter who closed."); return; }
    setClosingLoading(true);
    const upiTotal = payments
      .filter((p) => p.payment_date === format(new Date(), "yyyy-MM-dd") && ["UPI", "Online Transfer"].includes(p.method))
      .reduce((s, p) => s + Number(p.amount), 0);
    const difference = actualClosing - (openingCash + cashCollected);

    const { error } = await supabase.from("cash_closings").upsert({
      closing_date: format(new Date(), "yyyy-MM-dd"),
      opening_cash: openingCash,
      cash_collected: cashCollected,
      upi_online_total: upiTotal,
      actual_closing_cash: actualClosing,
      difference,
      closed_by: closedBy,
      notes: closingNotes || null,
      status: "Closed",
    }, { onConflict: "closing_date" });

    setClosingLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Cash closing saved!");
      setOpeningCash(0);
      setCashCollected(0);
      setActualClosing(0);
      setClosedBy("");
      setClosingNotes("");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold font-heading">Statistics</h1>
          <p className="text-muted-foreground mt-1">Revenue charts and collection reports</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as StatPeriod)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: allStudents.length, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "New Students", value: students.length, icon: UserPlus, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Fees Collected", value: formatCurrency(totalCollected), icon: CreditCard, color: "text-primary", bg: "bg-primary/10" },
          { label: "Pending Fees", value: formatCurrency(pendingFees), icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-border/50">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-xl font-bold font-heading">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-base">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Students by Course */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-base">Students by Course</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={courseData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {courseData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee Collection Doughnut */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-base">Fee Collection Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Method Doughnut */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-base">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={methodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                >
                  {methodData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cash Closing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-base">Daily Cash Closing</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCashClosing} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Opening Cash (₹)</Label>
                  <Input type="number" value={openingCash} onChange={(e) => setOpeningCash(Number(e.target.value))} className="mt-1" min={0} />
                </div>
                <div>
                  <Label>Cash Collected (₹)</Label>
                  <Input type="number" value={cashCollected} onChange={(e) => setCashCollected(Number(e.target.value))} className="mt-1" min={0} />
                </div>
                <div>
                  <Label>Actual Closing Cash (₹)</Label>
                  <Input type="number" value={actualClosing} onChange={(e) => setActualClosing(Number(e.target.value))} className="mt-1" min={0} />
                </div>
                <div>
                  <Label>Closed By</Label>
                  <Input value={closedBy} onChange={(e) => setClosedBy(e.target.value)} className="mt-1" placeholder="Name" required />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)} rows={2} className="mt-1" placeholder="Optional remarks" />
              </div>
              <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
                <p className="text-muted-foreground">Expected Closing: <span className="font-semibold text-foreground">{formatCurrency(openingCash + cashCollected)}</span></p>
                <p className={`font-semibold mt-0.5 ${actualClosing - (openingCash + cashCollected) < 0 ? "text-red-500" : "text-emerald-500"}`}>
                  Difference: {formatCurrency(Math.abs(actualClosing - (openingCash + cashCollected)))}
                  {actualClosing - (openingCash + cashCollected) < 0 ? " (shortage)" : " (surplus)"}
                </p>
              </div>
              <Button type="submit" disabled={closingLoading} className="w-full">
                {closingLoading ? "Saving..." : "Save Cash Closing"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Cash Closing History */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-base">Closing History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Cash</TableHead>
                    <TableHead className="text-xs">Diff</TableHead>
                    <TableHead className="text-xs">By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closingHistory.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-6">No closings yet</TableCell></TableRow>
                  ) : closingHistory.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs">{formatDate(c.closing_date)}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(c.actual_closing_cash)}</TableCell>
                      <TableCell className={`text-xs font-medium ${c.difference < 0 ? "text-red-500" : "text-emerald-500"}`}>
                        {c.difference >= 0 ? "+" : ""}{formatCurrency(c.difference)}
                      </TableCell>
                      <TableCell className="text-xs">{c.closed_by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

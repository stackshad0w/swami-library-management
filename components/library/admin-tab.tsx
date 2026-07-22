"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/server";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Trash2, Users, TrendingUp, BookOpen, Activity } from "lucide-react";
import type { SeatBooking } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export function AdminTab() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<SeatBooking[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("seat_bookings")
      .select("*, student:students(name, phone, student_id, course)")
      .order("booking_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (dateFilter) query = query.eq("booking_date", dateFilter);

    const { data } = await query;
    setBookings((data ?? []) as unknown as SeatBooking[]);
    setLoading(false);
  }, [dateFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const totalRevenue = bookings.reduce((s, b) => s + Number(b.fee), 0);
  const activeNow = bookings.filter((b) => b.status === "Active").length;
  const uniqueStudents = new Set(bookings.map((b) => b.student_id)).size;

  const handleExportCSV = () => {
    const header = "Seat,Student,Phone,Date,Slots,Fee,Method,Status\n";
    const rows = bookings.map((b) =>
      [
        b.seat_number,
        b.student?.name ?? "",
        b.student?.phone ?? "",
        b.booking_date,
        b.slots.map((s) => s.label).join("; "),
        b.fee,
        b.payment_method,
        b.status,
      ].join(",")
    );
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported bookings CSV!");
  };

  const handleClearExpired = async () => {
    if (!confirm("Clear all expired bookings? This cannot be undone.")) return;
    const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
    const { error } = await supabase
      .from("seat_bookings")
      .update({ status: "Expired" })
      .lt("booking_date", yesterday)
      .eq("status", "Active");
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Expired bookings cleared.");
      fetchBookings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: BookOpen, label: "Total Bookings", value: bookings.length, color: "text-primary" },
          { icon: TrendingUp, label: "Revenue", value: formatCurrency(totalRevenue), color: "text-emerald-500" },
          { icon: Activity, label: "Active Now", value: activeNow, color: "text-blue-500" },
          { icon: Users, label: "Unique Students", value: uniqueStudents, color: "text-amber-500" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="flex items-center gap-3 p-4">
                <Icon className={`h-5 w-5 ${stat.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold font-heading">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-44"
          placeholder="Filter by date"
        />
        {dateFilter && (
          <Button variant="ghost" size="sm" onClick={() => setDateFilter("")}>
            Clear
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClearExpired} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Clear Expired
          </Button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Seat</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="hidden lg:table-cell">Slots</TableHead>
                <TableHead className="hidden sm:table-cell">Fee</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((b) => (
                  <TableRow key={b.id} className="hover:bg-muted/20">
                    <TableCell className="font-bold text-primary">#{b.seat_number}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{b.student?.name}</p>
                      <p className="text-xs text-muted-foreground">{b.student?.student_id}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {b.student?.phone}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(b.booking_date)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {b.slots.map((s) => s.label).join(", ")}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {b.fee > 0 ? formatCurrency(b.fee) : "Free"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          b.status === "Active"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs"
                            : "bg-muted text-muted-foreground text-xs"
                        }
                      >
                        {b.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

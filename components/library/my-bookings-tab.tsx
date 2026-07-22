"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/server";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import type { SeatBooking } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export function MyBookingsTab() {
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [bookings, setBookings] = useState<SeatBooking[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("seat_bookings")
      .select("*, student:students(name, phone, student_id, course)")
      .order("booking_date", { ascending: false })
      .limit(100);

    if (dateFilter) query = query.eq("booking_date", dateFilter);

    const { data } = await query;
    setBookings((data ?? []) as unknown as SeatBooking[]);
    setLoading(false);
  }, [dateFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    return (
      !q ||
      b.student?.name?.toLowerCase().includes(q) ||
      b.student?.student_id?.toLowerCase().includes(q) ||
      b.student?.phone?.includes(q)
    );
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name, ID, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full sm:w-44"
        />
      </div>

      <p className="text-sm text-muted-foreground mb-3">{filtered.length} bookings</p>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">No bookings found</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((booking) => (
            <div
              key={booking.id}
              className="rounded-xl border border-border/50 bg-card px-4 py-3.5 flex items-center gap-4 flex-wrap"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0">
                {booking.seat_number}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{booking.student?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {booking.student?.student_id} · {booking.student?.phone}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {booking.slots.map((slot) => (
                    <span
                      key={slot.label}
                      className="inline-block rounded-full bg-muted text-muted-foreground text-[10px] px-2 py-0.5"
                    >
                      {slot.label} ({slot.start}–{slot.end})
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0 space-y-1">
                <p className="text-sm font-medium">{formatDate(booking.booking_date)}</p>
                {booking.fee > 0 && (
                  <p className="text-xs text-muted-foreground">{formatCurrency(booking.fee)} · {booking.payment_method}</p>
                )}
                <Badge
                  className={
                    booking.status === "Active"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs"
                      : "bg-muted text-muted-foreground text-xs"
                  }
                >
                  {booking.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

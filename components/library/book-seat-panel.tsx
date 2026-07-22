"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/server";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, X, BookOpen } from "lucide-react";
import { SeatMap } from "./seat-map";
import type { Student, SeatBooking, TimeSlot, PaymentMethod } from "@/lib/types";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

const PRESET_SLOTS: TimeSlot[] = [
  { label: "Morning", start: "06:00", end: "12:00" },
  { label: "Afternoon", start: "12:00", end: "17:00" },
  { label: "Evening", start: "17:00", end: "21:00" },
  { label: "Night", start: "21:00", end: "23:59" },
  { label: "Full Day", start: "06:00", end: "23:59" },
];

const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash", "UPI", "Online Transfer", "Cheque", "Demand Draft", "Card", "Free",
];

export function BookSeatPanel() {
  const supabase = createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const [date, setDate] = useState(today);
  const [studentSearch, setStudentSearch] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [customSlotStart, setCustomSlotStart] = useState("");
  const [customSlotEnd, setCustomSlotEnd] = useState("");
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [bookings, setBookings] = useState<SeatBooking[]>([]);
  const [fee, setFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [loading, setLoading] = useState(false);

  // Fetch bookings for date
  const fetchBookings = useCallback(async () => {
    const { data } = await supabase
      .from("seat_bookings")
      .select("*, student:students(name, phone, student_id, course)")
      .eq("booking_date", date)
      .eq("status", "Active");
    setBookings((data ?? []) as unknown as SeatBooking[]);
  }, [date]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Student search
  useEffect(() => {
    if (!studentSearch.trim()) { setStudents([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("students")
        .select("*")
        .or(
          `name.ilike.%${studentSearch}%,student_id.ilike.%${studentSearch}%,phone.ilike.%${studentSearch}%`
        )
        .eq("is_active", true)
        .limit(8);
      setStudents((data ?? []) as Student[]);
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  const togglePresetSlot = (slot: TimeSlot) => {
    setSelectedSlots((prev) =>
      prev.some((s) => s.label === slot.label)
        ? prev.filter((s) => s.label !== slot.label)
        : [...prev, slot]
    );
  };

  const addCustomSlot = () => {
    if (!customSlotStart || !customSlotEnd) {
      toast.error("Enter both start and end times.");
      return;
    }
    const label = `${customSlotStart}–${customSlotEnd}`;
    const slot: TimeSlot = { label, start: customSlotStart, end: customSlotEnd };
    setSelectedSlots((prev) => [...prev, slot]);
    setCustomSlotStart("");
    setCustomSlotEnd("");
  };

  const handleBook = async () => {
    if (!selectedStudent) { toast.error("Select a student."); return; }
    if (selectedSlots.length === 0) { toast.error("Select at least one time slot."); return; }
    if (!selectedSeat) { toast.error("Select a seat from the map."); return; }

    // Check if seat is already booked for date (overlap)
    const existing = bookings.find((b) => b.seat_number === selectedSeat);
    if (existing) {
      toast.error(`Seat ${selectedSeat} is already occupied.`);
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("seat_bookings").insert({
      seat_number: selectedSeat,
      student_id: selectedStudent.id,
      booking_date: date,
      slots: selectedSlots,
      fee,
      payment_method: paymentMethod,
      status: "Active",
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Seat ${selectedSeat} booked for ${selectedStudent.name}!`);
      setSelectedSeat(null);
      setSelectedStudent(null);
      setStudentSearch("");
      setSelectedSlots([]);
      setFee(0);
      fetchBookings();
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Left: Booking Form */}
      <div className="space-y-5">
        {/* Date */}
        <div>
          <Label htmlFor="booking-date">Booking Date</Label>
          <Input
            id="booking-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 max-w-xs"
          />
        </div>

        {/* Student Search */}
        <div>
          <Label>Student</Label>
          {selectedStudent ? (
            <div className="mt-1 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                {selectedStudent.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedStudent.name}</p>
                <p className="text-xs text-muted-foreground">{selectedStudent.student_id} · {selectedStudent.phone}</p>
              </div>
              <button
                onClick={() => { setSelectedStudent(null); setStudentSearch(""); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or phone..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-9"
              />
              {students.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-border bg-popover shadow-lg">
                  {students.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 first:rounded-t-lg last:rounded-b-lg transition-colors"
                      onClick={() => {
                        setSelectedStudent(s);
                        setStudentSearch("");
                        setStudents([]);
                      }}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.student_id} · {s.course}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Time Slots */}
        <div>
          <Label className="mb-2 block">Time Slots</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_SLOTS.map((slot) => {
              const isSelected = selectedSlots.some((s) => s.label === slot.label);
              return (
                <button
                  key={slot.label}
                  type="button"
                  onClick={() => togglePresetSlot(slot)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    isSelected
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {slot.label}
                  <span className="ml-1 opacity-60">
                    {slot.start}–{slot.end}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Slot */}
          <div className="flex items-center gap-2 mt-3">
            <Input
              type="time"
              value={customSlotStart}
              onChange={(e) => setCustomSlotStart(e.target.value)}
              className="flex-1 text-sm"
              placeholder="Start"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="time"
              value={customSlotEnd}
              onChange={(e) => setCustomSlotEnd(e.target.value)}
              className="flex-1 text-sm"
              placeholder="End"
            />
            <Button type="button" size="icon" variant="outline" onClick={addCustomSlot}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected slots list */}
          {selectedSlots.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedSlots.map((slot) => (
                <span
                  key={slot.label}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-1"
                >
                  {slot.label}
                  <button onClick={() => setSelectedSlots((p) => p.filter((s) => s.label !== slot.label))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Fee & Method */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="booking-fee">Fee (₹)</Label>
            <Input
              id="booking-fee"
              type="number"
              value={fee}
              onChange={(e) => setFee(Number(e.target.value))}
              min={0}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
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
        </div>

        {/* Selected Seat indicator */}
        {selectedSeat && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Selected Seat</p>
              <p className="text-2xl font-bold text-primary font-heading">#{selectedSeat}</p>
            </div>
            <button onClick={() => setSelectedSeat(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <Button onClick={handleBook} disabled={loading} className="w-full gap-2">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Booking...
            </span>
          ) : (
            <>
              <BookOpen className="h-4 w-4" />
              Confirm Booking
            </>
          )}
        </Button>
      </div>

      {/* Right: Seat Map */}
      <div>
        <h3 className="font-heading font-bold text-base mb-3">
          Seat Availability — {date}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Click an available seat to select it
        </p>
        <SeatMap
          bookings={bookings}
          selectedSeat={selectedSeat}
          onSeatClick={(seatNum) => {
            const booking = bookings.find((b) => b.seat_number === seatNum);
            if (!booking) setSelectedSeat(seatNum);
          }}
          selectable
        />
      </div>
    </div>
  );
}

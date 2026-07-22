"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SeatBooking } from "@/lib/types";

interface SeatMapProps {
  bookings: SeatBooking[];
  selectedSeat?: number | null;
  onSeatClick?: (seatNumber: number) => void;
  selectable?: boolean;
}

const TOTAL_SEATS = 84;

// Layout: seats arranged in rows
const ROWS = [
  { row: "A", seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { row: "B", seats: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24] },
  { row: "C", seats: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36] },
  { row: "D", seats: [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48] },
  { row: "E", seats: [49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60] },
  { row: "F", seats: [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72] },
  { row: "G", seats: [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84] },
];

export function SeatMap({
  bookings,
  selectedSeat,
  onSeatClick,
  selectable = true,
}: SeatMapProps) {
  const [hoveredBooking, setHoveredBooking] = useState<SeatBooking | null>(null);

  const bookingMap = new Map<number, SeatBooking>();
  bookings.forEach((b) => bookingMap.set(b.seat_number, b));

  return (
    <div className="w-full overflow-x-auto">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-5 px-1">
        {[
          { cls: "seat-available", label: "Available" },
          { cls: "seat-occupied", label: "Occupied" },
          { cls: "seat-selected", label: "Selected" },
        ].map(({ cls, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`h-5 w-5 rounded ${cls} flex items-center justify-center text-[10px]`} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Entrance */}
      <div className="text-center mb-3">
        <span className="inline-block rounded-full border border-border/50 bg-muted/30 px-4 py-1 text-xs font-medium text-muted-foreground">
          🚪 Entrance
        </span>
      </div>

      {/* Seat Grid */}
      <div className="space-y-1.5 min-w-[480px]">
        {ROWS.map(({ row, seats }) => (
          <div key={row} className="flex items-center gap-1.5">
            {/* Row Label */}
            <span className="w-5 text-xs font-medium text-muted-foreground text-center flex-shrink-0">
              {row}
            </span>
            {/* Seats */}
            <div className="flex flex-1 gap-1.5">
              {seats.map((seatNum, idx) => {
                const booking = bookingMap.get(seatNum);
                const isOccupied = !!booking;
                const isSelected = selectedSeat === seatNum;

                // Aisle gap after seat 6 (middle)
                const hasAisle = idx === 5;

                return (
                  <div key={seatNum} className={`flex items-center gap-1.5 ${hasAisle ? "mr-2" : ""}`}>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            disabled={!selectable && !isOccupied}
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded text-[10px] font-semibold transition-all duration-100",
                              isSelected
                                ? "seat-selected"
                                : isOccupied
                                ? "seat-occupied"
                                : "seat-available"
                            )}
                            onClick={() => onSeatClick?.(seatNum)}
                            onMouseEnter={() => booking && setHoveredBooking(booking)}
                            onMouseLeave={() => setHoveredBooking(null)}
                          >
                            {seatNum}
                          </button>
                        }
                      />
                      {booking && (
                        <TooltipContent side="top" className="max-w-[200px]">
                          <p className="font-semibold">{booking.student?.name}</p>
                          <p className="text-xs text-muted-foreground">{booking.student?.phone}</p>
                          <p className="text-xs">
                            {booking.slots.map((s) => `${s.label}`).join(", ")}
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mt-4 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-red-500">{bookings.length}</span> occupied ·{" "}
          <span className="font-semibold text-emerald-500">{TOTAL_SEATS - bookings.length}</span> available
        </p>
      </div>
    </div>
  );
}

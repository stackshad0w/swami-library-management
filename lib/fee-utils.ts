import type { FeeTier, Gender, Shift } from "./types";

export function lookupFee(
  tiers: FeeTier[],
  gender: Gender,
  shift: Shift,
  months: number
): number {
  // Exact match first
  const exact = tiers.find(
    (t) => t.gender === gender && t.shift === shift && t.months === months
  );
  if (exact) return exact.fee;

  // Fallback to "All" gender
  const all = tiers.find(
    (t) => t.gender === "All" && t.shift === shift && t.months === months
  );
  if (all) return all.fee;

  return 0;
}

export function calculateSubscriptionBalance(
  totalFees: number,
  paidFees: number,
  subscriptionMonths: number,
  feeDueDate: string | null | undefined
): number {
  if (!feeDueDate || subscriptionMonths <= 0) return 0;
  const today = new Date();
  const due = new Date(feeDueDate);
  const msLeft = due.getTime() - today.getTime();
  if (msLeft <= 0) return 0;
  const daysLeft = msLeft / (1000 * 60 * 60 * 24);
  const totalDays = subscriptionMonths * 30;
  const proportion = Math.min(1, daysLeft / totalDays);
  return Math.round(totalFees * proportion);
}

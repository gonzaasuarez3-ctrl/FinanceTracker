import { addDays, differenceInCalendarDays, getDaysInMonth, isWeekend, setDate, startOfDay } from "date-fns";
import type { DueDayRule, ISODate } from "./types";

function toDate(iso: ISODate): Date {
  return startOfDay(new Date(iso + "T00:00:00"));
}

function toISO(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

function lastWorkdayOfMonth(year: number, month: number): Date {
  // month is 0-indexed
  const last = new Date(year, month + 1, 0);
  let d = last;
  while (isWeekend(d)) {
    d = addDays(d, -1);
  }
  return d;
}

/**
 * Resolves a recurrence rule to the next concrete occurrence on/after `from`.
 * Pure function — no I/O, fully deterministic, unit-tested.
 */
export function resolveNextOccurrence(rule: DueDayRule, from: ISODate): ISODate {
  const fromDate = toDate(from);

  if (rule.type === "fixed" || rule.type === "approximate") {
    const day = rule.day;
    let candidate = clampToMonth(fromDate.getFullYear(), fromDate.getMonth(), day);
    if (candidate < fromDate) {
      const nextMonth = fromDate.getMonth() + 1;
      candidate = clampToMonth(
        fromDate.getFullYear() + Math.floor(nextMonth / 12),
        nextMonth % 12,
        day
      );
    }
    if (rule.type === "approximate") {
      // Conservative: for planning purposes we treat the LATER bound as the
      // date used in safe-to-spend math, so the user is never caught short.
      candidate = addDays(candidate, rule.varianceDays);
    }
    return toISO(candidate);
  }

  if (rule.type === "lastWorkday") {
    let candidate = lastWorkdayOfMonth(fromDate.getFullYear(), fromDate.getMonth());
    if (candidate < fromDate) {
      const nextMonth = fromDate.getMonth() + 1;
      candidate = lastWorkdayOfMonth(
        fromDate.getFullYear() + Math.floor(nextMonth / 12),
        nextMonth % 12
      );
    }
    return toISO(candidate);
  }

  // custom: everyDays starting from anchor
  const anchor = toDate(rule.anchor);
  const diff = differenceInCalendarDays(fromDate, anchor);
  const cyclesElapsed = Math.max(0, Math.ceil(diff / rule.everyDays));
  const candidate = addDays(anchor, cyclesElapsed * rule.everyDays);
  return toISO(candidate < fromDate ? addDays(candidate, rule.everyDays) : candidate);
}

function clampToMonth(year: number, month: number, day: number): Date {
  const daysInMonth = getDaysInMonth(new Date(year, month, 1));
  return new Date(year, month, Math.min(day, daysInMonth));
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.max(0, differenceInCalendarDays(toDate(to), toDate(from)));
}

export { toISO, toDate };

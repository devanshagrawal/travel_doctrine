import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export function fmtDate(iso?: string, template = 'MMM D, YYYY'): string {
  if (!iso) return '';
  return dayjs(iso).format(template);
}

// Flight depart/arrive datetimes are stored as a "floating" wall-clock time
// (written zoneless, so Postgres keeps it as UTC). Format them in UTC so they
// show exactly as entered, for every viewer regardless of local timezone.
export function fmtDateUtc(iso?: string, template = 'MMM D, YYYY'): string {
  if (!iso) return '';
  return dayjs.utc(iso).format(template);
}

export function fmtDateRange(start: string, end: string): string {
  const s = dayjs(start);
  const e = dayjs(end);
  if (s.year() === e.year()) {
    if (s.month() === e.month()) {
      return `${s.format('MMM D')} – ${e.format('D, YYYY')}`;
    }
    return `${s.format('MMM D')} – ${e.format('MMM D, YYYY')}`;
  }
  return `${s.format('MMM D, YYYY')} – ${e.format('MMM D, YYYY')}`;
}

export function tripDurationDays(start: string, end: string): number {
  return Math.max(1, dayjs(end).diff(dayjs(start), 'day') + 1);
}

export function nights(checkIn: string, checkOut: string): number {
  return Math.max(1, dayjs(checkOut).diff(dayjs(checkIn), 'day'));
}

export function fmtTime(iso?: string): string {
  if (!iso) return '';
  return dayjs.utc(iso).format('h:mm A');
}

// Relative countdown label for a trip, e.g. "In 12 days", "Ongoing", "Ended".
export function tripStatus(start: string, end: string): { label: string; tone: 'upcoming' | 'ongoing' | 'past' } {
  const now = dayjs();
  if (now.isBefore(dayjs(start), 'day')) {
    const d = dayjs(start).diff(now, 'day');
    return { label: d === 0 ? 'Starts today' : `In ${d} day${d === 1 ? '' : 's'}`, tone: 'upcoming' };
  }
  if (now.isAfter(dayjs(end), 'day')) {
    return { label: 'Completed', tone: 'past' };
  }
  return { label: 'Ongoing', tone: 'ongoing' };
}

// Status that also respects an explicit completion (completedAt overrides dates).
export function tripStatusFor(trip: { startDate: string; endDate: string; completedAt?: string | null }) {
  if (trip.completedAt) return { label: 'Completed', tone: 'past' as const };
  return tripStatus(trip.startDate, trip.endDate);
}

// Is this trip finished — either manually completed or past its end date?
export function isTripDone(trip: { endDate: string; completedAt?: string | null }): boolean {
  return !!trip.completedAt || dayjs().isAfter(dayjs(trip.endDate), 'day');
}

// Simple id generator for locally-created records.
export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// Group a list of days between two dates (inclusive) as ISO date strings.
export function daysBetween(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = dayjs(start);
  const last = dayjs(end);
  while (cur.isBefore(last) || cur.isSame(last, 'day')) {
    out.push(cur.format('YYYY-MM-DD'));
    cur = cur.add(1, 'day');
  }
  return out;
}

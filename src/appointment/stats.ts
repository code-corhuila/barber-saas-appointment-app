import type { ApiClient } from '../shell-contract';
import type { Appointment, Page } from './types';

/**
 * A barber's metrics (the prototype's (barber)/stats, decision of 2026-10-04): appointments of the day,
 * the week or the month, completed ones, no-shows, cancellations and the income of the completed ones
 * (the price each one was booked at). Computed from GET /api/v1/appointments, with no new endpoint.
 */
export type Period = 'day' | 'week' | 'month';

export const PERIOD_LABELS: Record<Period, string> = { day: 'Hoy', week: 'Esta semana', month: 'Este mes' };

export interface BarberStats {
  total: number;
  completed: number;
  noShows: number;
  cancelled: number;
  revenueCents: number;
  /** Completed out of the ones that ended (completed, no-show or cancelled); null when none ended. */
  completionRate: number | null;
  /** Pending or confirmed from today on, whatever the period. */
  upcoming: number;
}

/** YYYY-MM-DD by the device's calendar, as the agenda's days. */
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Both ends inclusive. A week starts on Monday, as the calendar in Colombia. */
export function periodRange(period: Period, today: Date = new Date()): { from: string; to: string } {
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  if (period === 'day') {
    return { from: isoDate(today), to: isoDate(today) };
  }
  if (period === 'week') {
    const sinceMonday = (today.getDay() + 6) % 7;
    return { from: isoDate(new Date(y, m, d - sinceMonday)), to: isoDate(new Date(y, m, d - sinceMonday + 6)) };
  }
  return { from: isoDate(new Date(y, m, 1)), to: isoDate(new Date(y, m + 1, 0)) };
}

export function barberStats(appointments: Appointment[], from: string, to: string, today: string): BarberStats {
  const inPeriod = appointments.filter((a) => a.date >= from && a.date <= to);
  const count = (status: Appointment['status']) => inPeriod.filter((a) => a.status === status).length;
  const completed = count('COMPLETED');
  const noShows = count('NO_SHOW');
  const cancelled = count('CANCELLED');
  const ended = completed + noShows + cancelled;
  return {
    total: inPeriod.length,
    completed,
    noShows,
    cancelled,
    revenueCents: inPeriod.filter((a) => a.status === 'COMPLETED').reduce((sum, a) => sum + a.priceAtBookingCents, 0),
    completionRate: ended === 0 ? null : Math.round((completed / ended) * 100),
    upcoming: appointments.filter((a) => a.date >= today && (a.status === 'PENDING' || a.status === 'CONFIRMED')).length,
  };
}

/** At most this many pages of 100: a month of a busy barber fits with room. */
const MAX_PAGES = 10;

/**
 * The barber's appointments from {@code from} on. The list comes most recent first, so pages are read
 * until one reaches a date before {@code from}, or there are no more.
 */
export async function appointmentsSince(api: ApiClient, barberId: string, from: string): Promise<Appointment[]> {
  const all: Appointment[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const query = new URLSearchParams({ barberId, page: String(page), limit: '100' });
    const result = await api.get<Page<Appointment>>(`/api/v1/appointments?${query}`);
    all.push(...result.data);
    const oldest = result.data[result.data.length - 1];
    if (!oldest || oldest.date < from || page >= result.meta.totalPages) break;
  }
  return all;
}

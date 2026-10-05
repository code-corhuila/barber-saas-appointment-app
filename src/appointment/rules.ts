import { isApiError, type ShellSession } from '../shell-contract';
import type { Appointment, AppointmentStatus, Transition } from './types';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * The next seven days as the booking and agenda chips show them. By the device's calendar: the
 * prototype used toISOString(), which in Colombia jumps to tomorrow after 7 p.m.
 */
export function nextDays(today: Date = new Date()): { value: string; label: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return { value, label: i === 0 ? 'Hoy' : `${DAY_NAMES[d.getDay()]} ${d.getDate()}` };
  });
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Staff actions per status, as 08-diagrams/uml/state-appointment.md draws them. */
export function actionsFor(status: AppointmentStatus): (Transition | 'cancel')[] {
  switch (status) {
    case 'PENDING': return ['confirm', 'cancel'];
    case 'CONFIRMED': return ['start', 'no-show', 'cancel'];
    case 'IN_PROGRESS': return ['complete'];
    default: return [];
  }
}

/** The service still checks the barbershop's cancellation window and answers why if it is closed. */
export function canClientCancel(status: AppointmentStatus): boolean {
  return status === 'PENDING' || status === 'CONFIRMED';
}

/** The barbershop to book in: the one of barbershop-app's link, or else the one the session entered. */
export function bookingShop(fromLink: string | undefined, entered: string | null): string | null {
  return fromLink ?? entered ?? null;
}

/**
 * Every request of the booking is scoped to the barbershop, so the session enters it first
 * (DEC-AUTH-06): for a client that brings the token bound to it; for staff it resolves at once.
 * If it cannot be entered, nothing is requested.
 */
export async function enterThen<T>(session: Pick<ShellSession, 'enterBarbershop'>, barbershopId: string,
                                   load: () => Promise<T>): Promise<T> {
  await session.enterBarbershop(barbershopId);
  return load();
}

/** What the person reads when the barbershop cannot be entered, and whether trying again can help. */
export function enterFailure(err: unknown): { message: string; retry: boolean } {
  if (isApiError(err) && err.code === 'NOT_FOUND') {
    return { message: 'Esta barbería no está disponible en este momento.', retry: false };
  }
  if (isApiError(err) && err.code === 'SERVICE_UNAVAILABLE') {
    return { message: 'No pudimos comprobar la barbería. Inténtalo de nuevo.', retry: true };
  }
  return { message: isApiError(err) ? err.userMessage : 'No pudimos abrir la barbería. Inténtalo de nuevo.', retry: true };
}

/** The profile of the signed-in barber; a barber without one has no agenda yet. */
export function ownBarber(barbers: { id: string; userId: string }[], userId: string): string | null {
  return barbers.find((b) => b.userId === userId)?.id ?? null;
}

/** What the completed appointments generated, the price each one was booked at. */
export function completedTotal(appointments: Appointment[]): number {
  return appointments.filter((a) => a.status === 'COMPLETED').reduce((sum, a) => sum + a.priceAtBookingCents, 0);
}

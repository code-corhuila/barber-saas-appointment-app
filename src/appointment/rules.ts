import type { SessionUser } from '../shell-contract';
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

/**
 * Why this person cannot book here, or null. The barbershop comes from the token, and a client's
 * token is not bound to the barbershop they picked yet (OQ-07): say so instead of failing later.
 */
export function bookingBlocked(user: Pick<SessionUser, 'role' | 'barbershopId'> | null,
                               barbershopId: string | undefined): string | null {
  if (!user) return 'Inicia sesión para reservar una cita.';
  if (barbershopId && user.barbershopId !== barbershopId) {
    return 'Tu cuenta aún no está vinculada a esta barbería, así que todavía no puedes reservar aquí.';
  }
  if (!user.barbershopId) {
    return 'Tu cuenta aún no está vinculada a una barbería, así que todavía no puedes reservar.';
  }
  return null;
}

/** The profile of the signed-in barber; a barber without one has no agenda yet. */
export function ownBarber(barbers: { id: string; userId: string }[], userId: string): string | null {
  return barbers.find((b) => b.userId === userId)?.id ?? null;
}

/** What the completed appointments generated, the price each one was booked at. */
export function completedTotal(appointments: Appointment[]): number {
  return appointments.filter((a) => a.status === 'COMPLETED').reduce((sum, a) => sum + a.priceAtBookingCents, 0);
}

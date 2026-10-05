import type { ApiClient } from '../shell-contract';
import type { Appointment, Availability, BarberProfile, NewAppointment, Page, Service, Transition } from './types';

/**
 * Typed calls, ALWAYS through the shell's client (context.api): never fetch or axios (norm 5.4.1).
 * The barbershop and the user are the token's: no call sends them.
 */

/** A day of an agenda fits in one page of 100. */
export function listAppointments(api: ApiClient, filter: { barberId?: string; date?: string; status?: string }):
    Promise<Page<Appointment>> {
  const query = new URLSearchParams();
  if (filter.barberId) query.set('barberId', filter.barberId);
  if (filter.date) query.set('date', filter.date);
  if (filter.status) query.set('status', filter.status);
  query.set('limit', '100');
  return api.get<Page<Appointment>>(`/api/v1/appointments?${query}`);
}

/** One key per intent: the same key when the person retries, so a retry never books twice. */
export function bookAppointment(api: ApiClient, a: NewAppointment, idempotencyKey: string): Promise<Appointment> {
  const notes = a.notes?.trim();
  return api.post<Appointment>('/api/v1/appointments', {
    barberId: a.barberId,
    serviceId: a.serviceId,
    date: a.date,
    startTime: a.startTime,
    ...(notes ? { notes } : {}),
  }, { idempotencyKey });
}

export function move(api: ApiClient, id: string, transition: Transition): Promise<Appointment> {
  return api.post<Appointment>(`/api/v1/appointments/${id}/${transition}`);
}

/** An empty reason is left out. */
export function cancelAppointment(api: ApiClient, id: string, reason: string): Promise<Appointment> {
  const text = reason.trim();
  return api.post<Appointment>(`/api/v1/appointments/${id}/cancel`, text ? { reason: text } : {});
}

/** The services and barbers belong to the barbershop domain: asked to barbershop-api, through the gateway. */
export function listServices(api: ApiClient): Promise<Page<Service>> {
  return api.get<Page<Service>>('/api/v1/services?limit=100');
}

export function listBarbers(api: ApiClient): Promise<Page<BarberProfile>> {
  return api.get<Page<BarberProfile>>('/api/v1/barbers?limit=100');
}

/** The booking's catalog: the public pages of the barbershop the client picked (DEC-SHOP-02). */
export function listShopServices(api: ApiClient, barbershopId: string): Promise<Page<Service>> {
  return api.get<Page<Service>>(`/api/v1/barbershops/${encodeURIComponent(barbershopId)}/services?limit=100`);
}

export function listShopBarbers(api: ApiClient, barbershopId: string): Promise<Page<BarberProfile>> {
  return api.get<Page<BarberProfile>>(`/api/v1/barbershops/${encodeURIComponent(barbershopId)}/barbers?limit=100`);
}

/** The free slots belong to the schedule domain: asked to schedule-api, through the gateway. */
export function getAvailability(api: ApiClient, barberId: string, serviceId: string, date: string):
    Promise<Availability> {
  const query = new URLSearchParams({ barberId, serviceId, date });
  return api.get<Availability>(`/api/v1/availability?${query}`);
}

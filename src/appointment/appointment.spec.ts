import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '../shell-contract';
import {
  bookAppointment, cancelAppointment, getAvailability, listAppointments, listBarbers, listServices, move,
} from './appointments-api';
import { actionsFor, bookingBlocked, canClientCancel, completedTotal, nextDays, ownBarber } from './rules';
import { formatCop, STATUS_LABELS } from './labels';
import type { Appointment } from './types';

function fakeApi() {
  return {
    get: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn(), patch: vi.fn(), delete: vi.fn(),
  } satisfies ApiClient;
}

const appointment = (over: Partial<Appointment>): Appointment => ({
  id: 'a1', clientId: 'c1', barberId: 'b1', serviceId: 's1', date: '2026-10-10', startTime: '10:00',
  endTime: '10:30', status: 'PENDING', priceAtBookingCents: 2_500_000, notes: null, cancelledReason: null,
  createdAt: '', updatedAt: '', createdBy: 'c1', ...over,
});

describe('appointments api', () => {
  it('lists with only the filters given, never the barbershop, which comes from the token', async () => {
    const api = fakeApi();

    await listAppointments(api, { barberId: 'b1', date: '2026-10-10' });
    await listAppointments(api, {});

    expect(api.get).toHaveBeenNthCalledWith(1, '/api/v1/appointments?barberId=b1&date=2026-10-10&limit=100');
    expect(api.get).toHaveBeenNthCalledWith(2, '/api/v1/appointments?limit=100');
  });

  it('books with the idempotency key of the intent and without price, status or barbershop', async () => {
    const api = fakeApi();

    await bookAppointment(api, { barberId: 'b1', serviceId: 's1', date: '2026-10-10', startTime: '10:00',
      notes: '  ' }, 'key-1');

    expect(api.post).toHaveBeenCalledWith('/api/v1/appointments',
      { barberId: 'b1', serviceId: 's1', date: '2026-10-10', startTime: '10:00' }, { idempotencyKey: 'key-1' });
  });

  it('moves an appointment through the route of each transition', async () => {
    const api = fakeApi();

    await move(api, 'a1', 'no-show');
    await cancelAppointment(api, 'a1', 'Me surgió algo');
    await cancelAppointment(api, 'a2', '');

    expect(api.post).toHaveBeenNthCalledWith(1, '/api/v1/appointments/a1/no-show');
    expect(api.post).toHaveBeenNthCalledWith(2, '/api/v1/appointments/a1/cancel', { reason: 'Me surgió algo' });
    expect(api.post).toHaveBeenNthCalledWith(3, '/api/v1/appointments/a2/cancel', {});
  });

  it('asks barbershop-api and schedule-api through the same client and the gateway', async () => {
    const api = fakeApi();

    await listServices(api);
    await listBarbers(api);
    await getAvailability(api, 'b1', 's1', '2026-10-10');

    expect(api.get).toHaveBeenNthCalledWith(1, '/api/v1/services?limit=100');
    expect(api.get).toHaveBeenNthCalledWith(2, '/api/v1/barbers?limit=100');
    expect(api.get).toHaveBeenNthCalledWith(3, '/api/v1/availability?barberId=b1&serviceId=s1&date=2026-10-10');
  });
});

describe('rules', () => {
  it('offers the next seven days by the local calendar, today first', () => {
    const days = nextDays(new Date(2026, 9, 4, 23, 30));

    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({ value: '2026-10-04', label: 'Hoy' });
    expect(days[1]).toEqual({ value: '2026-10-05', label: 'Lun 5' });
  });

  it('offers staff only the transitions the state machine draws', () => {
    expect(actionsFor('PENDING')).toEqual(['confirm', 'cancel']);
    expect(actionsFor('CONFIRMED')).toEqual(['start', 'no-show', 'cancel']);
    expect(actionsFor('IN_PROGRESS')).toEqual(['complete']);
    expect(actionsFor('COMPLETED')).toEqual([]);
    expect(actionsFor('CANCELLED')).toEqual([]);
  });

  it('lets a client try to cancel only pending or confirmed appointments', () => {
    expect(canClientCancel('PENDING')).toBe(true);
    expect(canClientCancel('CONFIRMED')).toBe(true);
    expect(canClientCancel('IN_PROGRESS')).toBe(false);
  });

  it('explains why a client cannot book in a barbershop their session is not bound to (OQ-07)', () => {
    expect(bookingBlocked({ role: 'CLIENT', barbershopId: 'shop-1' }, 'shop-1')).toBeNull();
    expect(bookingBlocked({ role: 'CLIENT', barbershopId: 'shop-1' }, undefined)).toBeNull();
    expect(bookingBlocked({ role: 'CLIENT', barbershopId: null }, 'shop-1')).toMatch(/vinculada/);
    expect(bookingBlocked({ role: 'CLIENT', barbershopId: 'shop-2' }, 'shop-1')).toMatch(/vinculada/);
    expect(bookingBlocked(null, 'shop-1')).toMatch(/Inicia sesión/);
  });

  it("finds the barber's own profile by user id", () => {
    expect(ownBarber([{ id: 'p1', userId: 'u1' }, { id: 'p2', userId: 'u2' }], 'u2')).toBe('p2');
    expect(ownBarber([{ id: 'p1', userId: 'u1' }], 'u9')).toBeNull();
  });

  it('adds up only what completed appointments generated', () => {
    expect(completedTotal([appointment({ status: 'COMPLETED' }), appointment({ status: 'CANCELLED' }),
      appointment({ status: 'COMPLETED', priceAtBookingCents: 1_000_000 })])).toBe(3_500_000);
  });
});

describe('labels', () => {
  it('shows every status in Spanish and money in whole pesos', () => {
    expect(STATUS_LABELS.NO_SHOW).toBe('No asistió');
    expect(formatCop(2_500_000)).toBe('$ 25.000');
  });
});

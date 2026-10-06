import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '../shell-contract';
import {
  bookAppointment, cancelAppointment, getAvailability, getBarbershop, listAppointments, listBarbers, listServices,
  listShopBarbers, listShopServices, move,
} from './appointments-api';
import { barberName, loadClientNames } from './catalog';
import { actionsFor, bookingShop, canClientCancel, completedTotal, enterFailure, enterThen, nextDays, ownBarber } from './rules';
import { explain, formatCop, STATUS_LABELS } from './labels';
import type { Appointment } from './types';

function fakeApi() {
  return {
    get: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn(), patch: vi.fn(), delete: vi.fn(),
  } satisfies ApiClient;
}

const appointment = (over: Partial<Appointment>): Appointment => ({
  id: 'a1', barbershopId: 'shop-1', clientId: 'c1', barberId: 'b1', serviceId: 's1', date: '2026-10-10', startTime: '10:00',
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

  it("reads the booking's catalog from the barbershop's public pages", async () => {
    const api = fakeApi();

    await listShopServices(api, 'shop-1');
    await listShopBarbers(api, 'shop-1');

    expect(api.get).toHaveBeenNthCalledWith(1, '/api/v1/barbershops/shop-1/services?limit=100');
    expect(api.get).toHaveBeenNthCalledWith(2, '/api/v1/barbershops/shop-1/barbers?limit=100');
  });

  it("reads a barbershop's name from its public detail", async () => {
    const api = fakeApi();

    await getBarbershop(api, 'shop-1');

    expect(api.get).toHaveBeenCalledWith('/api/v1/barbershops/shop-1');
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

  it('books in the barbershop of the link, or else the one the session already entered', () => {
    expect(bookingShop('shop-1', null)).toBe('shop-1');
    expect(bookingShop('shop-1', 'shop-2')).toBe('shop-1');
    expect(bookingShop(undefined, 'shop-2')).toBe('shop-2');
    expect(bookingShop(undefined, null)).toBeNull();
  });

  it('says why the barbershop could not be entered and whether retrying makes sense', () => {
    const apiError = (status: number, code: string) =>
      ({ status, code, message: '', details: [], traceId: 't', userMessage: 'del shell' });

    expect(enterFailure(apiError(404, 'NOT_FOUND')))
      .toEqual({ message: 'Esta barbería no está disponible en este momento.', retry: false });
    expect(enterFailure(apiError(503, 'SERVICE_UNAVAILABLE')))
      .toEqual({ message: 'No pudimos comprobar la barbería. Inténtalo de nuevo.', retry: true });
    expect(enterFailure(apiError(0, 'NETWORK_ERROR'))).toEqual({ message: 'del shell', retry: true });
    expect(enterFailure(new Error('boom')).retry).toBe(true);
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

describe('names', () => {
  it("shows the barber's name, with a Spanish fallback while a profile has none", () => {
    expect(barberName({ fullName: 'Juan Pérez' })).toBe('Juan Pérez');
    expect(barberName({ fullName: null })).toBe('Barbero sin nombre');
    expect(barberName({ fullName: '  ' })).toBe('Barbero sin nombre');
    expect(barberName(undefined)).toBe('Barbero');
  });

  const page = <T>(data: T[]) => ({ data, meta: { page: 1, limit: 100, total: data.length, totalPages: 1 } });

  it("names a client's appointments from the public pages of each of their barbershops, once each", async () => {
    const api = fakeApi();
    api.get.mockImplementation(async (url: string) => {
      if (url === '/api/v1/barbershops/shop-1') return { id: 'shop-1', name: 'El Clásico' };
      if (url === '/api/v1/barbershops/shop-2') return { id: 'shop-2', name: 'La Navaja' };
      if (url === '/api/v1/barbershops/shop-1/services?limit=100') return page([{ id: 's1', name: 'Corte' }]);
      if (url === '/api/v1/barbershops/shop-2/services?limit=100') return page([{ id: 's2', name: 'Barba' }]);
      if (url === '/api/v1/barbershops/shop-1/barbers?limit=100') return page([{ id: 'b1', fullName: 'Juan' }]);
      return page([{ id: 'b2', fullName: 'Ana' }]);
    });

    const names = await loadClientNames(api, ['shop-1', 'shop-2', 'shop-1']);

    expect(api.get).toHaveBeenCalledTimes(6);
    expect(api.get).not.toHaveBeenCalledWith('/api/v1/services?limit=100');
    expect([names.barbershop!('shop-1'), names.service('s1'), names.barber('b1')]).toEqual(['El Clásico', 'Corte', 'Juan']);
    expect([names.barbershop!('shop-2'), names.service('s2'), names.barber('b2')]).toEqual(['La Navaja', 'Barba', 'Ana']);
  });

  it('keeps the list when a barbershop cannot be read, with neutral names', async () => {
    const api = fakeApi();
    api.get.mockRejectedValue(new Error('404'));

    const names = await loadClientNames(api, ['gone']);

    expect([names.barbershop!('gone'), names.service('s1'), names.barber('b1')]).toEqual(['Barbería', 'Servicio', 'Barbero']);
  });

  it('asks nothing when the client has no appointments', async () => {
    const api = fakeApi();

    await loadClientNames(api, []);

    expect(api.get).not.toHaveBeenCalled();
  });
});

describe('labels', () => {
  it('shows every status in Spanish and money in whole pesos', () => {
    expect(STATUS_LABELS.NO_SHOW).toBe('No asistió');
    expect(formatCop(2_500_000)).toBe('$ 25.000');
  });
});

describe('business messages', () => {
  const error = (status: number, message: string) => ({ status, message, userMessage: 'del shell' });

  it("says appointment-api's 422 in Spanish and leaves every other error to the shell", () => {
    expect(explain(error(422, 'The appointment is inside the cancellation window of 4 hours')))
      .toBe('Ya no puedes cancelar: la barbería pide hacerlo con al menos 4 horas de anticipación.');
    expect(explain(error(422, 'The barber already has an appointment at that time'))).toMatch(/ya fue reservado/);
    expect(explain(error(422, 'The barber does not offer that time on 2026-10-10'))).toMatch(/no atiende/);
    expect(explain(error(422, 'An appointment in COMPLETED cannot be cancelled'))).toMatch(/cambió de estado/);
    expect(explain(error(422, 'something else'))).toBe('del shell');
    expect(explain(error(404, 'Appointment not found'))).toBe('del shell');
  });
});

describe('entering the barbershop', () => {
  function fakeSession(fails?: unknown) {
    const calls: string[] = [];
    return {
      calls,
      enterBarbershop: vi.fn(async (id: string) => {
        calls.push(`enter ${id}`);
        if (fails) throw fails;
      }),
    };
  }

  it('enters the barbershop before any request scoped to it', async () => {
    const session = fakeSession();

    const result = await enterThen(session, 'shop-1', async () => {
      session.calls.push('load');
      return 'catalog';
    });

    expect(result).toBe('catalog');
    expect(session.calls).toEqual(['enter shop-1', 'load']);
  });

  it('requests nothing when the barbershop cannot be entered', async () => {
    const notFound = { status: 404, code: 'NOT_FOUND', message: '', details: [], traceId: 't', userMessage: 'x' };
    const session = fakeSession(notFound);
    const load = vi.fn();

    await expect(enterThen(session, 'shop-x', load)).rejects.toBe(notFound);
    expect(load).not.toHaveBeenCalled();
  });
});

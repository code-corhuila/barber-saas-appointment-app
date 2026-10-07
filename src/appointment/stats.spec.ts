import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '../shell-contract';
import { appointmentsSince, barberStats, periodRange } from './stats';
import type { Appointment, AppointmentStatus } from './types';

const appointment = (date: string, status: AppointmentStatus, cents = 2_500_000): Appointment => ({
  id: `${date}-${status}`, barbershopId: 'shop-1', clientId: 'c1', barberId: 'b1', serviceId: 's1', date,
  startTime: '10:00', endTime: '10:30', status, priceAtBookingCents: cents, notes: null, cancelledReason: null,
  createdAt: '', updatedAt: '', createdBy: 'c1',
});

describe('barber stats', () => {
  it('takes the day, the Monday-to-Sunday week and the calendar month of the device', () => {
    const wednesday = new Date(2026, 9, 7, 22, 0);

    expect(periodRange('day', wednesday)).toEqual({ from: '2026-10-07', to: '2026-10-07' });
    expect(periodRange('week', wednesday)).toEqual({ from: '2026-10-05', to: '2026-10-11' });
    expect(periodRange('week', new Date(2026, 9, 11))).toEqual({ from: '2026-10-05', to: '2026-10-11' });
    expect(periodRange('month', wednesday)).toEqual({ from: '2026-10-01', to: '2026-10-31' });
  });

  it('counts how the appointments of the period ended and adds what the completed ones generated', () => {
    const list = [
      appointment('2026-10-05', 'COMPLETED', 2_500_000),
      appointment('2026-10-06', 'COMPLETED', 3_000_000),
      appointment('2026-10-06', 'NO_SHOW'),
      appointment('2026-10-07', 'CANCELLED'),
      appointment('2026-10-08', 'CONFIRMED'),
      appointment('2026-10-12', 'PENDING'),
      appointment('2026-10-04', 'COMPLETED', 9_999_900),
    ];

    expect(barberStats(list, '2026-10-05', '2026-10-11', '2026-10-07')).toEqual({
      total: 5, completed: 2, noShows: 1, cancelled: 1, revenueCents: 5_500_000, completionRate: 50, upcoming: 2,
    });
  });

  it('has no completion rate while nothing of the period has ended', () => {
    expect(barberStats([appointment('2026-10-07', 'PENDING')], '2026-10-07', '2026-10-07', '2026-10-07').completionRate)
      .toBeNull();
  });

  it("reads the barber's pages until one reaches a date before the period", async () => {
    const page = (data: Appointment[], n: number) => ({ data, meta: { page: n, limit: 100, total: 300, totalPages: 3 } });
    const api = {
      get: vi.fn()
        .mockResolvedValueOnce(page([appointment('2026-10-20', 'PENDING'), appointment('2026-10-06', 'COMPLETED')], 1))
        .mockResolvedValueOnce(page([appointment('2026-10-02', 'COMPLETED'), appointment('2026-09-28', 'COMPLETED')], 2)),
      post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(),
    } satisfies ApiClient;

    const all = await appointmentsSince(api, 'b1', '2026-10-01');

    expect(all).toHaveLength(4);
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(api.get).toHaveBeenNthCalledWith(1, '/api/v1/appointments?barberId=b1&page=1&limit=100');
  });
});

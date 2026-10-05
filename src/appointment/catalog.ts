import type { ApiClient } from '../shell-contract';
import { listBarbers, listServices } from './appointments-api';
import type { BarberProfile, Service } from './types';

/** What a list shows next to each appointment, which carries only ids. */
export interface Names {
  service(id: string): string;
  barber(id: string): string;
}

/**
 * The service and barber names of the barbershop. A list must not fail because the catalog did:
 * without it the appointments still show, with neutral names.
 */
export async function loadNames(api: ApiClient): Promise<Names> {
  const [services, barbers] = await Promise.allSettled([listServices(api), listBarbers(api)]);
  const serviceById = new Map<string, Service>(
    services.status === 'fulfilled' ? services.value.data.map((s) => [s.id, s]) : []);
  const barberById = new Map<string, BarberProfile>(
    barbers.status === 'fulfilled' ? barbers.value.data.map((b) => [b.id, b]) : []);
  return {
    service: (id) => serviceById.get(id)?.name ?? 'Servicio',
    barber: (id) => barberName(barberById.get(id)),
  };
}

/**
 * The name barbershop-api copied from identity-auth (ADR-014). A profile created before that copy can
 * still come without one; a barber missing from the catalog is just "Barbero".
 */
export function barberName(barber: Pick<BarberProfile, 'fullName'> | undefined): string {
  if (!barber) return 'Barbero';
  return barber.fullName?.trim() || 'Barbero sin nombre';
}

import type { ApiClient } from '../shell-contract';
import { getBarbershop, listBarbers, listServices, listShopBarbers, listShopServices } from './appointments-api';
import type { Barbershop, BarberProfile, Service } from './types';

/** What a list shows next to each appointment, which carries only ids. */
export interface Names {
  service(id: string): string;
  barber(id: string): string;
  /** Only for a client's list, which can cross barbershops (DEC-APPT-06). */
  barbershop?(id: string): string;
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
 * A client's names, from the public pages of each barbershop their appointments belong to
 * (DEC-APPT-06): the barbershop's name from its detail, the barber and the service from its catalog.
 * Each barbershop is asked once; one that fails, or is no longer visible, leaves neutral names.
 */
export async function loadClientNames(api: ApiClient, barbershopIds: string[]): Promise<Names> {
  const shops = [...new Set(barbershopIds)];
  const loaded = await Promise.all(shops.map((id) => Promise.allSettled(
    [getBarbershop(api, id), listShopServices(api, id), listShopBarbers(api, id)] as const)));
  const shopById = new Map<string, Barbershop>();
  const serviceById = new Map<string, Service>();
  const barberById = new Map<string, BarberProfile>();
  loaded.forEach(([shop, services, barbers]) => {
    if (shop.status === 'fulfilled') shopById.set(shop.value.id, shop.value);
    if (services.status === 'fulfilled') services.value.data.forEach((s) => serviceById.set(s.id, s));
    if (barbers.status === 'fulfilled') barbers.value.data.forEach((b) => barberById.set(b.id, b));
  });
  return {
    service: (id) => serviceById.get(id)?.name ?? 'Servicio',
    barber: (id) => barberName(barberById.get(id)),
    barbershop: (id) => shopById.get(id)?.name ?? 'Barbería',
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

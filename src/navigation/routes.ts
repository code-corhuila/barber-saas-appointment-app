/**
 * The screens of the domain, under the shell's basePath (/appointments). A client starts on their
 * appointments, a barber on their agenda and the owner on the barbershop's agenda; '/new' is the
 * booking, reached from barbershop-app as /appointments/new?barbershopId=…&serviceId=…, and '/reviews'
 * the owner's reviews (DEC-APPT-11), reached from the shell's menu or the agenda.
 */
export type Route =
  | { name: 'home' }
  | { name: 'book'; barbershopId?: string; serviceId?: string }
  | { name: 'history' }
  | { name: 'stats' }
  | { name: 'reviews' };

export function parseRoute(path: string, search = ''): Route {
  const clean = path.replace(/\/+$/, '') || '/';
  if (clean === '/new') {
    const query = new URLSearchParams(search);
    return { name: 'book', barbershopId: query.get('barbershopId') ?? undefined,
      serviceId: query.get('serviceId') ?? undefined };
  }
  if (clean === '/history') return { name: 'history' };
  if (clean === '/stats') return { name: 'stats' };
  if (clean === '/reviews') return { name: 'reviews' };
  return { name: 'home' };
}

export function routePath(route: Route): string {
  switch (route.name) {
    case 'book': {
      const query = new URLSearchParams();
      if (route.barbershopId) query.set('barbershopId', route.barbershopId);
      if (route.serviceId) query.set('serviceId', route.serviceId);
      const text = query.toString();
      return text ? `/new?${text}` : '/new';
    }
    case 'history': return '/history';
    case 'stats': return '/stats';
    case 'reviews': return '/reviews';
    default: return '/';
  }
}

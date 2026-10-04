/**
 * The screens of the domain, under the shell's basePath (/appointments). A client starts on their
 * appointments, a barber on their agenda and the owner on the barbershop's agenda; '/new' is the
 * booking, reached from barbershop-app as /appointments/new?barbershopId=…&serviceId=….
 */
export type Route =
  | { name: 'home' }
  | { name: 'book'; barbershopId?: string; serviceId?: string }
  | { name: 'history' };

export function parseRoute(path: string, search = ''): Route {
  const clean = path.replace(/\/+$/, '') || '/';
  if (clean === '/new') {
    const query = new URLSearchParams(search);
    return { name: 'book', barbershopId: query.get('barbershopId') ?? undefined,
      serviceId: query.get('serviceId') ?? undefined };
  }
  if (clean === '/history') return { name: 'history' };
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
    default: return '/';
  }
}

import { useCallback, useEffect, useState } from 'react';
import type { MountContext } from './shell-contract';
import { parseRoute, routePath, type Route } from './navigation/routes';
import { BookingPage } from './pages/BookingPage';
import { MyAppointmentsPage } from './pages/MyAppointmentsPage';
import { STYLES } from './ui/styles';

/** The path inside the domain from the browser address, e.g. /appointments/new → /new. */
function pathInDomain(basePath: string): string {
  const path = window.location.pathname;
  return path.startsWith(basePath) ? path.slice(basePath.length) || '/' : '/';
}

/**
 * The appointment domain app (ADR-013). Everything it requests goes through context.api and it never
 * stores a token: the session is the shell's (norm 5.4.1).
 */
export function App({ context }: { context: MountContext }) {
  const user = context.session.user();
  // The shell passes the path without the query; the booking link carries its barbershop and service there.
  const [route, setRoute] = useState<Route>(() => parseRoute(context.initialPath, window.location.search));

  const go = useCallback((next: Route) => {
    setRoute(next);
    context.navigate(context.basePath + routePath(next));
  }, [context]);

  // The back button changes the address; the shell keeps this app mounted, so follow it here.
  useEffect(() => {
    const follow = () => setRoute(parseRoute(pathInDomain(context.basePath), window.location.search));
    window.addEventListener('popstate', follow);
    return () => window.removeEventListener('popstate', follow);
  }, [context.basePath]);

  let screen;
  if (!user) {
    screen = <p className="ap-empty">Inicia sesión para ver tus citas.</p>;
  } else if (route.name === 'book') {
    screen = <BookingPage api={context.api} user={user} barbershopId={route.barbershopId} serviceId={route.serviceId}
                          onBooked={() => go({ name: 'home' })} onBack={() => go({ name: 'home' })} />;
  } else if (user.role === 'CLIENT') {
    screen = <MyAppointmentsPage api={context.api} onBook={() => go({ name: 'book' })} />;
  } else {
    screen = <p className="ap-empty">La agenda de la barbería estará disponible muy pronto.</p>;
  }

  return (
    <div className="ap-root">
      <style>{STYLES}</style>
      {screen}
    </div>
  );
}

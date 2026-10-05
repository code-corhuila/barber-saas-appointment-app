import { useCallback, useEffect, useState } from 'react';
import { IonButton } from '@ionic/react';
import type { MountContext } from './shell-contract';
import { listBarbers } from './appointment/appointments-api';
import { bookingShop, ownBarber } from './appointment/rules';
import { parseRoute, routePath, type Route } from './navigation/routes';
import { AgendaPage } from './pages/AgendaPage';
import { BookingPage } from './pages/BookingPage';
import { HistoryPage } from './pages/HistoryPage';
import { MyAppointmentsPage } from './pages/MyAppointmentsPage';
import { LoadView } from './ui/LoadView';
import { useLoad } from './ui/load';
import { STYLES } from './ui/styles';

/** The path inside the domain from the browser address, e.g. /appointments/new → /new. */
function pathInDomain(basePath: string): string {
  const path = window.location.pathname;
  return path.startsWith(basePath) ? path.slice(basePath.length) || '/' : '/';
}

/** A barber's agenda and history, found by their user id among the barbershop's profiles. */
function BarberScreens({ context, userId, route, go }: { context: MountContext; userId: string; route: Route;
                                                        go(next: Route): void }) {
  const [own, reload] = useLoad(async () => ownBarber((await listBarbers(context.api)).data, userId), [userId],
    'No se pudo cargar tu perfil de barbero.');
  return (
    <LoadView load={own} onRetry={reload} isEmpty={(id) => id === null}
              empty="Aún no tienes perfil de barbero. Pide al administrador de la barbería que lo cree.">
      {(barberId) => (route.name === 'history'
        ? <HistoryPage api={context.api} barberId={barberId!} onBack={() => go({ name: 'home' })} />
        : <AgendaPage api={context.api} barberId={barberId!} title="Mi agenda"
                      onHistory={() => go({ name: 'history' })} />)}
    </LoadView>
  );
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
    const shop = bookingShop(route.barbershopId, context.session.barbershopId());
    const toCatalog = () => context.navigate('/barbershops');
    screen = shop
      ? <BookingPage key={shop} api={context.api} session={context.session} barbershopId={shop}
                     serviceId={route.serviceId} onBooked={() => go({ name: 'home' })} onCatalog={toCatalog} />
      : (
        <div className="ap-center">
          <p className="ap-empty">Elige una barbería en el catálogo para reservar tu cita.</p>
          <IonButton className="ap-primary" onClick={toCatalog}>Ver barberías</IonButton>
        </div>
      );
  } else if (user.role === 'CLIENT') {
    screen = <MyAppointmentsPage api={context.api} onBook={() => go({ name: 'book' })} />;
  } else if (user.role === 'BARBER') {
    screen = <BarberScreens context={context} userId={user.id} route={route} go={go} />;
  } else if (user.role === 'ADMIN_BARBERSHOP') {
    screen = <AgendaPage api={context.api} title="Agenda" />;
  } else {
    screen = <p className="ap-empty">La administración de la plataforma no gestiona citas de una barbería.</p>;
  }

  return (
    <div className="ap-root">
      <style>{STYLES}</style>
      {screen}
    </div>
  );
}

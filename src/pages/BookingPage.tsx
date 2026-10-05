import { useEffect, useRef, useState } from 'react';
import { IonButton, IonSpinner } from '@ionic/react';
import type { ApiClient, ShellSession } from '../shell-contract';
import { isApiError } from '../shell-contract';
import { bookAppointment, getAvailability, listShopBarbers, listShopServices } from '../appointment/appointments-api';
import { barberName } from '../appointment/catalog';
import { explain, formatCop } from '../appointment/labels';
import { enterFailure, enterThen, nextDays } from '../appointment/rules';
import { Field } from '../ui/Field';
import { LoadView } from '../ui/LoadView';
import { messageOf, newIdempotencyKey, useLoad } from '../ui/load';

interface BookingPageProps {
  api: ApiClient;
  session: Pick<ShellSession, 'enterBarbershop'>;
  /** From barbershop-app's link, or the barbershop the session already entered. */
  barbershopId: string;
  serviceId?: string;
  onBooked(): void;
  onCatalog(): void;
}

/**
 * The booking (the prototype's (client)/booking/[barbershopId]): service, barber, day and one of the
 * slots schedule-api offers. The server computes the end and the price; the button is disabled while
 * sending, and a retry of the same choice reuses its Idempotency-Key, so it never books twice.
 */
export function BookingPage({ api, session, barbershopId, serviceId: preselected, onBooked, onCatalog }: BookingPageProps) {
  const days = nextDays();
  const [serviceId, setServiceId] = useState<string | undefined>(preselected);
  const [barberId, setBarberId] = useState<string | undefined>();
  const [date, setDate] = useState(days[0].value);
  const [slot, setSlot] = useState<string | undefined>();
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = useRef(newIdempotencyKey());

  // Another choice is another intent: it gets its own key.
  useEffect(() => { key.current = newIdempotencyKey(); }, [serviceId, barberId, date, slot, notes]);

  // The session enters the barbershop before anything scoped to it is requested (DEC-AUTH-06).
  const [entered, setEntered] = useState<'entering' | 'in' | { message: string; retry: boolean }>('entering');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setEntered('entering');
    enterThen(session, barbershopId, async () => undefined).then(
      () => { if (current) setEntered('in'); },
      (err) => { if (current) setEntered(enterFailure(err)); });
    return () => { current = false; };
  }, [session, barbershopId, attempt]);

  const [catalog, reloadCatalog] = useLoad(async () => {
    if (entered !== 'in') return null;
    const [services, barbers] = await Promise.all([listShopServices(api, barbershopId),
      listShopBarbers(api, barbershopId)]);
    return { services: services.data.filter((s) => s.isActive), barbers: barbers.data };
  }, [entered, barbershopId], 'No se pudieron cargar los servicios y barberos.');

  const [slots, reloadSlots] = useLoad(async () => {
    if (entered !== 'in' || !serviceId || !barberId) return null;
    return (await getAvailability(api, barberId, serviceId, date)).slots;
  }, [entered, serviceId, barberId, date], 'No se pudo cargar la disponibilidad.');

  if (entered === 'entering') {
    return <div className="ap-center" role="status"><IonSpinner name="crescent" aria-label="Abriendo la barbería" /></div>;
  }
  if (entered !== 'in') {
    return (
      <section className="ap-page">
        <h1 className="ap-header">Reservar cita</h1>
        <div className="ap-center" role="alert">
          <p className="ap-error">{entered.message}</p>
          {entered.retry
            ? <IonButton className="ap-primary" onClick={() => setAttempt((n) => n + 1)}>Reintentar</IonButton>
            : <IonButton className="ap-secondary" fill="outline" onClick={onCatalog}>Volver al catálogo</IonButton>}
        </div>
      </section>
    );
  }

  async function confirm() {
    if (!serviceId || !barberId || !slot) return;
    setSending(true);
    setError(null);
    try {
      await bookAppointment(api, { serviceId, barberId, date, startTime: slot, notes }, key.current);
      onBooked();
    } catch (err) {
      setError(isApiError(err) ? explain(err) : messageOf(err, 'No se pudo reservar la cita.'));
      if (isApiError(err) && err.status === 422) {
        setSlot(undefined);
        reloadSlots();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="ap-page">
      <h1 className="ap-header">Reservar cita</h1>
      <LoadView load={catalog} onRetry={reloadCatalog} isEmpty={(c) => !c || c.services.length === 0}
                empty="Esta barbería aún no tiene servicios para reservar.">
        {(c) => (
          <>
            <h2 className="ap-section">Servicio</h2>
            {c!.services.map((s) => (
              <button key={s.id} type="button" className={`ap-card${s.id === serviceId ? ' selected' : ''}`}
                      aria-pressed={s.id === serviceId} onClick={() => { setServiceId(s.id); setSlot(undefined); }}>
                <span className="ap-grow"><p className="ap-title">{s.name}</p>
                  <p className="ap-muted">{s.durationMinutes} min</p></span>
                <span className="ap-price">{formatCop(s.priceCents)}</span>
              </button>
            ))}

            <h2 className="ap-section">Barbero</h2>
            {c!.barbers.length === 0 && <p className="ap-empty">Esta barbería aún no tiene barberos.</p>}
            <div className="ap-days">
              {c!.barbers.map((b) => (
                <button key={b.id} type="button" className={`ap-chip-button${b.id === barberId ? ' selected' : ''}`}
                        aria-pressed={b.id === barberId} onClick={() => { setBarberId(b.id); setSlot(undefined); }}>
                  {barberName(b)}
                </button>
              ))}
            </div>

            <h2 className="ap-section">Día</h2>
            <div className="ap-days">
              {days.map((d) => (
                <button key={d.value} type="button" className={`ap-chip-button${d.value === date ? ' selected' : ''}`}
                        aria-pressed={d.value === date} onClick={() => { setDate(d.value); setSlot(undefined); }}>
                  {d.label}
                </button>
              ))}
            </div>

            <h2 className="ap-section">Horarios disponibles</h2>
            {!serviceId || !barberId
              ? <p className="ap-hint">Elige un servicio y un barbero para ver su disponibilidad.</p>
              : (
                <LoadView load={slots} onRetry={reloadSlots} isEmpty={(s) => !s || s.length === 0}
                          empty="No hay horarios disponibles este día. Prueba otra fecha.">
                  {(s) => (
                    <div className="ap-slots">
                      {s!.map((x) => (
                        <button key={x.startTime} type="button" aria-pressed={x.startTime === slot}
                                className={`ap-chip-button${x.startTime === slot ? ' selected' : ''}`}
                                onClick={() => setSlot(x.startTime)}>
                          {x.startTime}
                        </button>
                      ))}
                    </div>
                  )}
                </LoadView>
              )}

            <Field id="notes" label="Nota para el barbero (opcional)" value={notes} multiline onChange={setNotes}
                   error={notes.length > 500 ? 'Máximo 500 caracteres.' : undefined} />
            {error && <div className="ap-alert" role="alert">{error}</div>}
          </>
        )}
      </LoadView>
      <div className="ap-footer">
        <IonButton expand="block" className="ap-primary" onClick={confirm}
                   disabled={!slot || sending || notes.length > 500}>
          {sending ? 'Reservando…' : slot ? `Confirmar cita · ${slot}` : 'Selecciona un horario'}
        </IonButton>
      </div>
    </section>
  );
}

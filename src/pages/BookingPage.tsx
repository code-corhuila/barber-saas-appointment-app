import { useEffect, useRef, useState } from 'react';
import { IonButton } from '@ionic/react';
import type { ApiClient, SessionUser } from '../shell-contract';
import { isApiError } from '../shell-contract';
import { bookAppointment, getAvailability, listBarbers, listServices } from '../appointment/appointments-api';
import { explain, formatCop } from '../appointment/labels';
import { bookingBlocked, nextDays } from '../appointment/rules';
import { Field } from '../ui/Field';
import { LoadView } from '../ui/LoadView';
import { messageOf, newIdempotencyKey, useLoad } from '../ui/load';

interface BookingPageProps {
  api: ApiClient;
  user: SessionUser | null;
  /** From barbershop-app's link; the booking itself always uses the token's barbershop. */
  barbershopId?: string;
  serviceId?: string;
  onBooked(): void;
  onBack(): void;
}

/**
 * The booking (the prototype's (client)/booking/[barbershopId]): service, barber, day and one of the
 * slots schedule-api offers. The server computes the end and the price; the button is disabled while
 * sending, and a retry of the same choice reuses its Idempotency-Key, so it never books twice.
 */
export function BookingPage({ api, user, barbershopId, serviceId: preselected, onBooked, onBack }: BookingPageProps) {
  const blocked = bookingBlocked(user, barbershopId);
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

  const [catalog, reloadCatalog] = useLoad(async () => {
    if (blocked) return null;
    const [services, barbers] = await Promise.all([listServices(api), listBarbers(api)]);
    return { services: services.data.filter((s) => s.isActive), barbers: barbers.data };
  }, [blocked], 'No se pudieron cargar los servicios y barberos.');

  const [slots, reloadSlots] = useLoad(async () => {
    if (!serviceId || !barberId) return null;
    return (await getAvailability(api, barberId, serviceId, date)).slots;
  }, [serviceId, barberId, date], 'No se pudo cargar la disponibilidad.');

  if (blocked) {
    return (
      <section className="ap-page">
        <h1 className="ap-header">Reservar cita</h1>
        <p className="ap-empty">{blocked}</p>
        <div className="ap-center"><IonButton className="ap-secondary" fill="outline" onClick={onBack}>Volver</IonButton></div>
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
                  Barbero · {b.experienceYears} años
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

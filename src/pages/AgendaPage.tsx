import { useState } from 'react';
import { IonButton } from '@ionic/react';
import type { ApiClient } from '../shell-contract';
import { isApiError } from '../shell-contract';
import { cancelAppointment, listAppointments, move } from '../appointment/appointments-api';
import { loadNames } from '../appointment/catalog';
import { ACTION_LABELS, explain } from '../appointment/labels';
import { actionsFor, nextDays } from '../appointment/rules';
import type { Appointment, Transition } from '../appointment/types';
import { AppointmentCard } from '../ui/AppointmentCard';
import { LoadView } from '../ui/LoadView';
import { messageOf, useLoad } from '../ui/load';

interface AgendaPageProps {
  api: ApiClient;
  /** A barber's own profile; undefined for the owner, who sees every barber of the barbershop. */
  barberId?: string;
  title: string;
  onHistory?(): void;
}

/**
 * The agenda of one day (the prototype's (barber)/agenda and (admin)/agenda): the appointments in
 * time order, with only the transitions the state machine allows for each status. The server decides
 * again; a refused transition shows why and the day reloads.
 */
export function AgendaPage({ api, barberId, title, onHistory }: AgendaPageProps) {
  const days = nextDays();
  const [date, setDate] = useState(days[0].value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [load, reload] = useLoad(async () => {
    const [page, names] = await Promise.all([listAppointments(api, { barberId, date }), loadNames(api)]);
    const byTime = [...page.data].sort((a, b) => a.startTime.localeCompare(b.startTime));
    return { appointments: byTime, names };
  }, [barberId, date], 'No se pudo cargar la agenda.');

  async function act(a: Appointment, action: Transition | 'cancel') {
    setBusy(true);
    setError(null);
    try {
      await (action === 'cancel' ? cancelAppointment(api, a.id, 'Cancelada por la barbería') : move(api, a.id, action));
    } catch (err) {
      setError(isApiError(err) ? explain(err) : messageOf(err, 'No se pudo actualizar la cita.'));
    } finally {
      setBusy(false);
      reload();
    }
  }

  return (
    <section className="ap-page">
      <div className="ap-row">
        <h1 className="ap-header">{title}</h1>
        {onHistory && <IonButton fill="outline" className="ap-secondary" onClick={onHistory}>Historial</IonButton>}
      </div>
      <div className="ap-days" role="group" aria-label="Día">
        {days.map((d) => (
          <button key={d.value} type="button" className={`ap-chip-button${d.value === date ? ' selected' : ''}`}
                  aria-pressed={d.value === date} onClick={() => setDate(d.value)}>
            {d.label}
          </button>
        ))}
      </div>
      {error && <div className="ap-alert" role="alert">{error}</div>}
      <LoadView load={load} onRetry={reload} isEmpty={(d) => d.appointments.length === 0}
                empty="No hay citas para este día.">
        {({ appointments, names }) => appointments.map((a) => (
          <AppointmentCard key={a.id} appointment={a} names={names} showDate={false}>
            {actionsFor(a.status).length > 0 && (
              <div className="ap-actions">
                {actionsFor(a.status).map((action) => (
                  <IonButton key={action} disabled={busy} onClick={() => act(a, action)}
                             fill={action === 'cancel' || action === 'no-show' ? 'outline' : 'solid'}
                             className={action === 'cancel' || action === 'no-show' ? 'ap-danger' : 'ap-primary'}>
                    {ACTION_LABELS[action]}
                  </IonButton>
                ))}
              </div>
            )}
          </AppointmentCard>
        ))}
      </LoadView>
    </section>
  );
}

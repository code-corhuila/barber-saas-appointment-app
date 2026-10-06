import { useState } from 'react';
import { IonButton } from '@ionic/react';
import type { ApiClient } from '../shell-contract';
import { isApiError } from '../shell-contract';
import { cancelAppointment, listAppointments } from '../appointment/appointments-api';
import { loadClientNames } from '../appointment/catalog';
import { explain } from '../appointment/labels';
import { canClientCancel } from '../appointment/rules';
import { AppointmentCard } from '../ui/AppointmentCard';
import { Field } from '../ui/Field';
import { LoadView } from '../ui/LoadView';
import { messageOf, useLoad } from '../ui/load';

interface MyAppointmentsPageProps {
  api: ApiClient;
  onBook(): void;
}

/**
 * A client's appointments, most recent first (the prototype's (client)/appointments). The server
 * returns only theirs — of every barbershop while the session has entered none (DEC-APPT-06) — and
 * each card names its barbershop. Cancelling asks first, and the barbershop's window is checked by
 * the server.
 */
export function MyAppointmentsPage({ api, onBook }: MyAppointmentsPageProps) {
  const [load, reload] = useLoad(async () => {
    const page = await listAppointments(api, {});
    const names = await loadClientNames(api, page.data.map((a) => a.barbershopId));
    return { appointments: page.data, names };
  }, [], 'No se pudieron cargar tus citas.');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel(id: string) {
    setBusy(true);
    setError(null);
    try {
      await cancelAppointment(api, id, reason);
      setConfirming(null);
      setReason('');
      reload();
    } catch (err) {
      setError(isApiError(err) ? explain(err) : messageOf(err, 'No se pudo cancelar la cita.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ap-page">
      <div className="ap-row">
        <h1 className="ap-header">Mis citas</h1>
        <IonButton className="ap-primary" onClick={onBook}>Reservar</IonButton>
      </div>
      {error && <div className="ap-alert" role="alert">{error}</div>}
      <LoadView load={load} onRetry={reload} isEmpty={(d) => d.appointments.length === 0}
                empty="Aún no tienes citas reservadas.">
        {({ appointments, names }) => appointments.map((a) => (
          <AppointmentCard key={a.id} appointment={a} names={names} showDate>
            {canClientCancel(a.status) && confirming !== a.id && (
              <div className="ap-actions">
                <IonButton fill="outline" className="ap-danger" disabled={busy}
                           onClick={() => { setConfirming(a.id); setError(null); }}>
                  Cancelar cita
                </IonButton>
              </div>
            )}
            {confirming === a.id && (
              <div className="ap-actions" style={{ display: 'block' }}>
                <p className="ap-muted">¿Seguro que quieres cancelar esta cita?</p>
                <Field id={`reason-${a.id}`} label="Motivo (opcional)" value={reason} onChange={setReason} />
                <IonButton className="ap-primary" disabled={busy} onClick={() => cancel(a.id)}>
                  {busy ? 'Cancelando…' : 'Sí, cancelar'}
                </IonButton>
                <IonButton fill="outline" className="ap-secondary" disabled={busy} onClick={() => setConfirming(null)}>
                  No
                </IonButton>
              </div>
            )}
          </AppointmentCard>
        ))}
      </LoadView>
    </section>
  );
}

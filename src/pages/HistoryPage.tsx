import { IonButton } from '@ionic/react';
import type { ApiClient } from '../shell-contract';
import { listAppointments } from '../appointment/appointments-api';
import { loadNames } from '../appointment/catalog';
import { formatCop } from '../appointment/labels';
import { completedTotal } from '../appointment/rules';
import { AppointmentCard } from '../ui/AppointmentCard';
import { LoadView } from '../ui/LoadView';
import { useLoad } from '../ui/load';

interface HistoryPageProps {
  api: ApiClient;
  barberId: string;
  onBack(): void;
}

/**
 * A barber's completed appointments and what they generated (the prototype's (barber)/history).
 * It reads appointment-api, not finance: the income itself is finance's, from AppointmentCompleted.
 */
export function HistoryPage({ api, barberId, onBack }: HistoryPageProps) {
  const [load, reload] = useLoad(async () => {
    const [page, names] = await Promise.all([listAppointments(api, { barberId, status: 'COMPLETED' }),
      loadNames(api)]);
    return { appointments: page.data, names };
  }, [barberId], 'No se pudo cargar tu historial.');

  return (
    <section className="ap-page">
      <div className="ap-row">
        <h1 className="ap-header">Mi historial</h1>
        <IonButton fill="outline" className="ap-secondary" onClick={onBack}>Agenda</IonButton>
      </div>
      <LoadView load={load} onRetry={reload} isEmpty={(d) => d.appointments.length === 0}
                empty="Aún no has completado ningún corte.">
        {({ appointments, names }) => (
          <>
            <div className="ap-card" style={{ cursor: 'default', justifyContent: 'space-around' }}>
              <div><p className="ap-time">{appointments.length}</p><p className="ap-muted">Cortes hechos</p></div>
              <div><p className="ap-time">{formatCop(completedTotal(appointments))}</p>
                <p className="ap-muted">Total generado</p></div>
            </div>
            <p className="ap-hint">Los últimos 100 cortes completados. Las facturas y el resumen los maneja el administrador.</p>
            {appointments.map((a) => <AppointmentCard key={a.id} appointment={a} names={names} showDate />)}
          </>
        )}
      </LoadView>
    </section>
  );
}

import { useState } from 'react';
import { IonButton } from '@ionic/react';
import type { ApiClient } from '../shell-contract';
import { formatCop } from '../appointment/labels';
import { appointmentsSince, barberStats, isoDate, PERIOD_LABELS, periodRange, type Period } from '../appointment/stats';
import { LoadView } from '../ui/LoadView';
import { useLoad } from '../ui/load';

interface StatsPageProps {
  api: ApiClient;
  barberId: string;
  onBack(): void;
}

const PERIODS: Period[] = ['day', 'week', 'month'];

/**
 * A barber's metrics (the prototype's (barber)/stats): the appointments of the period, how they ended
 * and what the completed ones generated. Ratings are not shown: the contract has no reviews yet.
 */
export function StatsPage({ api, barberId, onBack }: StatsPageProps) {
  const [period, setPeriod] = useState<Period>('week');
  const [load, reload] = useLoad(async () => {
    const today = new Date();
    const { from, to } = periodRange(period, today);
    return barberStats(await appointmentsSince(api, barberId, from), from, to, isoDate(today));
  }, [barberId, period], 'No se pudieron cargar tus métricas.');

  return (
    <section className="ap-page">
      <div className="ap-row">
        <h1 className="ap-header">Mis métricas</h1>
        <IonButton fill="outline" className="ap-secondary" onClick={onBack}>Agenda</IonButton>
      </div>
      <div className="ap-days" role="group" aria-label="Periodo">
        {PERIODS.map((p) => (
          <button key={p} type="button" className={`ap-chip-button${p === period ? ' selected' : ''}`}
                  aria-pressed={p === period} onClick={() => setPeriod(p)}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>
      <LoadView load={load} onRetry={reload} isEmpty={() => false} empty="">
        {(s) => (
          <>
            <div className="ap-metrics">
              <Metric label="Citas" value={String(s.total)} />
              <Metric label="Completadas" value={String(s.completed)} />
              <Metric label="No asistió" value={String(s.noShows)} />
              <Metric label="Canceladas" value={String(s.cancelled)} />
              <Metric label="Ingresos generados" value={formatCop(s.revenueCents)} highlight />
              <Metric label="Tasa de finalización" value={s.completionRate === null ? '—' : `${s.completionRate}%`} />
              <Metric label="Citas próximas" value={String(s.upcoming)} />
            </div>
            <p className="ap-hint">Los ingresos suman el precio con que se reservó cada cita completada.</p>
          </>
        )}
      </LoadView>
    </section>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`ap-metric${highlight ? ' highlight' : ''}`}>
      <p className="ap-metric-value">{value}</p>
      <p className="ap-muted">{label}</p>
    </div>
  );
}

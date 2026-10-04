import type { ReactNode } from 'react';
import type { Names } from '../appointment/catalog';
import { formatCop, STATUS_COLORS, STATUS_LABELS } from '../appointment/labels';
import type { Appointment } from '../appointment/types';

interface AppointmentCardProps {
  appointment: Appointment;
  names: Names;
  /** The agenda leads with the time; the client's list with the date and time. */
  showDate: boolean;
  children?: ReactNode;
}

/** One appointment as every list of the domain shows it, with the prototype's card and colours. */
export function AppointmentCard({ appointment: a, names, showDate, children }: AppointmentCardProps) {
  return (
    <article className="ap-card" style={{ display: 'block', cursor: 'default' }}>
      <div className="ap-row">
        {showDate
          ? <p className="ap-title">{names.service(a.serviceId)}</p>
          : <p className="ap-time">{a.startTime}</p>}
        <span className="ap-badge" style={{ background: STATUS_COLORS[a.status] }}>{STATUS_LABELS[a.status]}</span>
      </div>
      {!showDate && <p className="ap-title">{names.service(a.serviceId)}</p>}
      <p className="ap-muted">{names.barber(a.barberId)}</p>
      {showDate && <p className="ap-muted">{a.date} · {a.startTime} – {a.endTime}</p>}
      {!showDate && a.clientId === null && <p className="ap-muted">Sin cuenta (atendido en el local)</p>}
      <p className="ap-price">{a.priceAtBookingCents === 0 ? 'Gratis' : formatCop(a.priceAtBookingCents)}</p>
      {a.notes && <p className="ap-muted">Nota: {a.notes}</p>}
      {a.cancelledReason && <p className="ap-reason">Motivo: {a.cancelledReason}</p>}
      {children}
    </article>
  );
}

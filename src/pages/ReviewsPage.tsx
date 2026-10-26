import { useState } from 'react';
import { IonButton } from '@ionic/react';
import type { ApiClient } from '../shell-contract';
import { listBarbers, listReviews } from '../appointment/appointments-api';
import { barberName } from '../appointment/catalog';
import { formatRating } from '../appointment/labels';
import { reviewPages } from '../appointment/rules';
import { LoadView } from '../ui/LoadView';
import { useLoad } from '../ui/load';
import { Stars } from '../ui/Stars';

interface ReviewsPageProps {
  api: ApiClient;
  /** The owner's barbershop, from the session (the token's): never a choice of the screen. */
  barbershopId: string;
  onBack(): void;
}

/**
 * The owner's reviews (DEC-APPT-11): the average and count of the barbershop or of one barber, and the
 * reviews newest first, 20 at a time. The list is the public read of appointment-api.
 */
export function ReviewsPage({ api, barbershopId, onBack }: ReviewsPageProps) {
  const [barberId, setBarberId] = useState<string | undefined>(undefined);
  const [pages, setPages] = useState(1);
  const [barbers] = useLoad(async () => (await listBarbers(api)).data, [], 'No se pudieron cargar los barberos.');
  const [load, reload] = useLoad(
    () => reviewPages((page) => listReviews(api, barbershopId, barberId, page), pages),
    [barbershopId, barberId, pages], 'No se pudieron cargar las reseñas.');
  const nameOf = (id: string) => barberName(barbers.state === 'ready' ? barbers.data.find((b) => b.id === id) : undefined);

  function pick(id: string | undefined) {
    setBarberId(id);
    setPages(1);
  }

  return (
    <section className="ap-page">
      <div className="ap-row">
        <h1 className="ap-header">Reseñas</h1>
        <IonButton fill="outline" className="ap-secondary" onClick={onBack}>Agenda</IonButton>
      </div>
      {barbers.state === 'ready' && barbers.data.length > 0 && (
        <div className="ap-days" role="group" aria-label="Barbero">
          {[{ id: undefined, label: 'Todos' }, ...barbers.data.map((b) => ({ id: b.id, label: barberName(b) }))]
            .map((option) => (
              <button key={option.id ?? 'all'} type="button" aria-pressed={option.id === barberId}
                      className={`ap-chip-button${option.id === barberId ? ' selected' : ''}`}
                      onClick={() => pick(option.id)}>
                {option.label}
              </button>
            ))}
        </div>
      )}
      <LoadView load={load} onRetry={reload} isEmpty={() => false} empty="">
        {({ reviews, summary, more }) => (
          <>
            <div className="ap-metric highlight" style={{ marginBottom: '.75rem' }}>
              <p className="ap-metric-value">{formatRating(summary.averageRating)}</p>
              <Stars value={summary.averageRating ?? 0} label={`Promedio ${formatRating(summary.averageRating)} de 5`} />
              <p className="ap-muted">
                {summary.reviewCount === 1 ? '1 reseña' : `${summary.reviewCount} reseñas`}
              </p>
            </div>
            {reviews.length === 0 && <p className="ap-empty">Aún no hay reseñas.</p>}
            {reviews.map((r) => (
              <article key={r.id} className="ap-card" style={{ display: 'block', cursor: 'default' }}>
                <div className="ap-row">
                  <p className="ap-title">{r.clientDisplayName}</p>
                  <Stars value={r.rating} label={`${r.rating} de 5`} />
                </div>
                <p className="ap-gold">{nameOf(r.barberId)}</p>
                <p className="ap-muted">{r.createdAt.slice(0, 10)}</p>
                {r.comment && <p>{r.comment}</p>}
              </article>
            ))}
            {more && (
              <IonButton fill="outline" className="ap-secondary" expand="block" onClick={() => setPages((n) => n + 1)}>
                Ver más
              </IonButton>
            )}
          </>
        )}
      </LoadView>
    </section>
  );
}

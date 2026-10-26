import { useState } from 'react';
import { IonButton, IonModal } from '@ionic/react';
import type { ApiClient } from '../shell-contract';
import { isApiError } from '../shell-contract';
import { reviewAppointment } from '../appointment/appointments-api';
import { explain, isAlreadyReviewed } from '../appointment/labels';
import { Field } from './Field';
import { messageOf } from './load';
import { Stars } from './Stars';

interface ReviewSheetProps {
  api: ApiClient;
  /** The COMPLETED appointment being rated; null closes the sheet. */
  appointmentId: string | null;
  onClose(): void;
  /** The review was stored, or the server says it already was: either way the button goes away. */
  onDone(appointmentId: string, message: string): void;
}

/** The bottom sheet to rate a completed appointment (DEC-APPT-11): five stars and an optional comment. */
export function ReviewSheet({ api, appointmentId, onClose, onDone }: ReviewSheetProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tooLong = comment.length > 500;

  function reset() {
    setRating(0);
    setComment('');
    setError(null);
  }

  async function send(id: string) {
    setBusy(true);
    setError(null);
    try {
      await reviewAppointment(api, id, rating, comment);
      reset();
      onDone(id, '¡Gracias por tu reseña!');
    } catch (err) {
      if (isApiError(err) && isAlreadyReviewed(err)) {
        reset();
        onDone(id, 'Ya calificaste esta cita');
      } else {
        setError(isApiError(err) ? explain(err) : messageOf(err, 'No se pudo enviar tu reseña.'));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <IonModal className="ap-modal" isOpen={appointmentId !== null} initialBreakpoint={0.6} breakpoints={[0, 0.6, 1]}
              onDidDismiss={() => { reset(); onClose(); }}>
      <div className="ap-page">
        <h2 className="ap-header">Calificar tu cita</h2>
        <Stars value={rating} onChange={setRating} label="Calificación" />
        <Field id="review-comment" label="Comentario (opcional)" value={comment} multiline onChange={setComment}
               error={tooLong ? 'Máximo 500 caracteres.' : undefined} />
        {error && <div className="ap-alert" role="alert">{error}</div>}
        <IonButton className="ap-primary" expand="block" disabled={busy || rating === 0 || tooLong || !appointmentId}
                   onClick={() => appointmentId && send(appointmentId)}>
          {busy ? 'Enviando…' : 'Enviar reseña'}
        </IonButton>
      </div>
    </IonModal>
  );
}

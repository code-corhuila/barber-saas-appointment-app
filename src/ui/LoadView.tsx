import type { ReactNode } from 'react';
import { IonButton, IonSpinner } from '@ionic/react';
import type { Load } from './load';

interface LoadViewProps<T> {
  load: Load<T>;
  onRetry(): void;
  /** The empty state: a view whose data has nothing to show. */
  isEmpty(data: T): boolean;
  empty: string;
  children(data: T): ReactNode;
}

/** Renders whichever of the four states the view is in. */
export function LoadView<T>({ load, onRetry, isEmpty, empty, children }: LoadViewProps<T>) {
  if (load.state === 'loading') {
    return <div className="ap-center" role="status"><IonSpinner name="crescent" aria-label="Cargando" /></div>;
  }
  if (load.state === 'error') {
    return (
      <div className="ap-center" role="alert">
        <p className="ap-error">{load.message}</p>
        <IonButton className="ap-primary" onClick={onRetry}>Intentar de nuevo</IonButton>
      </div>
    );
  }
  if (isEmpty(load.data)) {
    return <p className="ap-empty">{empty}</p>;
  }
  return <>{children(load.data)}</>;
}

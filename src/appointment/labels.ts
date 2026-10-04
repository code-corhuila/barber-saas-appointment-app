import type { AppointmentStatus } from './types';

/** What a person reads for each status, with the prototype's colours. */
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En proceso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: '#FFA500',
  CONFIRMED: '#4CAF50',
  IN_PROGRESS: '#2196F3',
  COMPLETED: '#888888',
  CANCELLED: '#FF6B6B',
  NO_SHOW: '#FF6B6B',
};

export const ACTION_LABELS = {
  confirm: 'Confirmar',
  start: 'Iniciar',
  complete: 'Completar',
  'no-show': 'No asistió',
  cancel: 'Cancelar',
} as const;

/** Prices travel as integer cents of COP (ADR-010); people read whole pesos. */
const PESOS = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

export function formatCop(cents: number): string {
  return `$ ${PESOS.format(Math.round(cents / 100))}`;
}

/**
 * The shell decides the message of every error (userMessage), but it only knows identity's business
 * texts and shows a generic one for any other 422. These are appointment-api's, so this domain says
 * them better; anything else keeps the shell's message.
 */
export function explain(err: { status: number; message: string; userMessage: string }): string {
  if (err.status !== 422) return err.userMessage;
  const window = /cancellation window of (\d+) hours/.exec(err.message);
  if (window) return `Ya no puedes cancelar: la barbería pide hacerlo con al menos ${window[1]} horas de anticipación.`;
  if (err.message.startsWith('The barber already has an appointment')) return 'Ese horario ya fue reservado. Elige otro.';
  if (err.message.startsWith('The barber does not offer that time')) return 'El barbero no atiende a esa hora. Elige otro horario.';
  if (err.message.startsWith('The service does not fit')) return 'El servicio no alcanza a terminar ese día. Elige una hora más temprano.';
  if (err.message.startsWith('An appointment in')) return 'La cita cambió de estado. Actualiza la lista.';
  return err.userMessage;
}

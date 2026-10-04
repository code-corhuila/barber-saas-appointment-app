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

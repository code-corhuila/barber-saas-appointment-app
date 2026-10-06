/**
 * The resources the app uses, as the APIs return them. They replace the prototype's
 * src/types/appointment.ts: ids are UUIDs, money is integer cents (ADR-010), times are HH:mm, and
 * an appointment carries ids instead of names (the names live in other domains).
 */
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

/** appointment-service.yaml 2.2.0, Appointment. */
export interface Appointment {
  id: string;
  /** Output only (DEC-APPT-06): which barbershop it belongs to, since a client's list crosses them. */
  barbershopId: string;
  /** null for a walk-in created by staff. */
  clientId: string | null;
  barberId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  priceAtBookingCents: number;
  notes: string | null;
  cancelledReason: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/** appointment-service.yaml, BookAppointmentRequest: no price, status or barbershop (DEC-APPT-02). */
export interface NewAppointment {
  barberId: string;
  serviceId: string;
  date: string;
  startTime: string;
  notes?: string;
}

/** The staff transitions of the state machine, by the last segment of their route. */
export type Transition = 'confirm' | 'start' | 'complete' | 'no-show';

/** barbershop-service.yaml, Barbershop: only what this app shows. */
export interface Barbershop {
  id: string;
  name: string;
}

/** barbershop-service.yaml, Service. */
export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  isActive: boolean;
}

/** barbershop-service.yaml 1.3.0, BarberProfile: the name is a snapshot from identity-auth (ADR-014). */
export interface BarberProfile {
  id: string;
  userId: string;
  fullName: string | null;
  experienceYears: number;
}

/** schedule-service.yaml, Availability. */
export interface Availability {
  slots: { startTime: string; endTime: string }[];
}

/** The {data, meta} envelope of every list (_shared.yaml). */
export interface Page<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

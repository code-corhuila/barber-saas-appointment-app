# barber-saas-appointment-app

> appointment bounded context: mobile UI (remote)

Part of the **Barber Saas** distributed system — team `barber-saas`, Grupo 2.
Governance and documentation live in [`barber-saas-docs`](https://github.com/code-corhuila/barber-saas-docs).

## Branching

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/...  hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another: `merge develop -> qa` and `merge qa -> main` do not exist in this model.

`main` requires **1 approval from `ariel5253`**. On `develop` and `qa` the team sets its own review
rule.

Full policy: `00-governance/branching-policy.md` in `barber-saas-docs`.

---

## BarberSaaS — what this repository is

The appointment screens of BarberSaaS: an **Ionic React** domain app (ADR-013) mounted by the
Angular shell (`barber-saas-front`) at `/appointments`. It exposes only `./mount` through Native
Federation and shares nothing: it receives the shell's HTTP client and session in the mount
context, so it never creates a client or stores a token itself (norm 5.4.1). Screens ported from
the prototype (`(client)/booking/[barbershopId]`, `(client)/appointments`, `(barber)/agenda`,
`(barber)/history`, `(admin)/agenda`), same dark and gold look, with Ionic components.

| Screen | Who | Calls |
|---|---|---|
| Mis citas: the client's appointments of every barbershop, cancel one | `CLIENT` | `GET /api/v1/appointments`, then per barbershop `GET /api/v1/barbershops/{id}`, `/services` and `/barbers` (barbershop-api, public), `POST …/{id}/cancel` |
| Reservar cita: service, barber, day, free slot, note | `CLIENT` (from barbershop-app's *Continuar*: `/appointments/new?barbershopId&serviceId`) | `context.session.enterBarbershop(id)` first, then `GET /api/v1/barbershops/{id}/services` and `/barbers` (barbershop-api), `GET /api/v1/availability` (schedule-api), `POST /api/v1/appointments` with `Idempotency-Key` |
| Mi agenda: one day, confirm, start, complete, no-show, cancel | `BARBER` (own profile) | `GET /api/v1/appointments?barberId&date`, `POST …/{id}/{transition}` |
| Mi historial: completed appointments and their total | `BARBER` | `GET /api/v1/appointments?barberId&status=COMPLETED` |
| Mis métricas: appointments of today, this week or this month — completed, no-shows, cancelled, income of the completed ones, completion rate, upcoming | `BARBER` | `GET /api/v1/appointments?barberId&page&limit=100`, pages until the period's first day |
| Agenda: the whole barbershop, one day | `ADMIN_BARBERSHOP` | `GET /api/v1/appointments?date`, `POST …/{id}/{transition}` |

```
src/mount.tsx                  ./mount(element, context) — what the shell calls
src/shell-contract.ts          the types of the contract with the shell (copied, never imported)
src/appointment/               typed calls through context.api, the rules of the screens, labels, names
src/navigation/routes.ts       /, /new, /history and /stats inside /appointments
src/pages/                     MyAppointmentsPage, BookingPage, AgendaPage, HistoryPage
src/ui/                        the four states of every view, the card, fields, styles (prefix ap-)
```

**Booking for a client (DEC-AUTH-06).** The barbershop comes from barbershop-app's link, or else from
the one the session already entered (`context.session.barbershopId()`). Before any request scoped to
it, the app awaits `context.session.enterBarbershop(barbershopId)`: the shell gets the client a token
bound to that barbershop and `context.api` sends it from then on. If the barbershop is closed or
unknown (`NOT_FOUND`) the screen says so and goes back to the catalog; if it could not be checked
(`SERVICE_UNAVAILABLE`) it offers *Reintentar*. Barbers are shown by the `fullName` barbershop-api
copied from identity-auth (ADR-014), with a Spanish fallback while a profile has none.

**A client's list (DEC-APPT-06).** While the session has entered no barbershop, *Mis citas* gets the
client's appointments of every barbershop; each one carries its `barbershopId`. The names come from
the public pages of those barbershops, each asked once: its name from `GET /api/v1/barbershops/{id}`,
the barber and the service from its catalog. A barbershop that cannot be read leaves neutral names
(*Barbería*, *Barbero*, *Servicio*) and the list still shows.

Every view shows loading, error with retry, empty and data. The booking button is disabled while
sending and each intent has its own `Idempotency-Key`, reused if the same choice is retried, so a
retry never books twice. Only the transitions the state machine allows are offered; the server
decides again, and its business answers (cancellation window, slot taken) are shown in Spanish.

### How to start it

```bash
npm ci
npm start      # builds and serves dist/appointment at http://localhost:4304 (CORS on)
```

Then start the shell (`npm start` in `barber-saas-front`) and the platform (`./scripts/up.sh dev`
in `barber-saas-infra-postgres`), and open `/appointments`.

### Where the data is

Nowhere in this app: the appointments live in the `appointment` schema (`appointment-api`), the
services and barbers in `barbershop`, the free slots are computed by `schedule-api`, and the
session is the shell's.

### How it is tested

`npm test` (Vitest): the calls to the APIs, the day chips, the actions per status, the booking
guard, the labels and business messages, the routes and the error messages. CI also checks the
types and builds the remote.

### What is missing

- Not in the contract yet: rescheduling, reviews of a completed appointment, and the reward coupon
  applied at booking that the prototype had.

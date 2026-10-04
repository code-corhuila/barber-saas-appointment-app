# barber-saas-appointment-app

> appointment bounded context: mobile UI (remote)

Part of the **LMS Library** distributed system — team `lms-library`, Grupo 2.
Governance and documentation live in [`library-docs`](https://github.com/code-corhuila/library-docs).

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

Full policy: `00-governance/branching-policy.md` in `library-docs`.

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
| Mis citas: the client's appointments, cancel one | `CLIENT` | `GET /api/v1/appointments`, `POST …/{id}/cancel` |
| Reservar cita: service, barber, day, free slot, note | `CLIENT` (also `/appointments/new?barbershopId&serviceId` from barbershop-app) | `GET /api/v1/services`, `/api/v1/barbers` (barbershop-api), `GET /api/v1/availability` (schedule-api), `POST /api/v1/appointments` with `Idempotency-Key` |
| Mi agenda: one day, confirm, start, complete, no-show, cancel | `BARBER` (own profile) | `GET /api/v1/appointments?barberId&date`, `POST …/{id}/{transition}` |
| Mi historial: completed appointments and their total | `BARBER` | `GET /api/v1/appointments?barberId&status=COMPLETED` |
| Agenda: the whole barbershop, one day | `ADMIN_BARBERSHOP` | `GET /api/v1/appointments?date`, `POST …/{id}/{transition}` |

```
src/mount.tsx                  ./mount(element, context) — what the shell calls
src/shell-contract.ts          the types of the contract with the shell (copied, never imported)
src/appointment/               typed calls through context.api, the rules of the screens, labels, names
src/navigation/routes.ts       /, /new and /history inside /appointments
src/pages/                     MyAppointmentsPage, BookingPage, AgendaPage, HistoryPage
src/ui/                        the four states of every view, the card, fields, styles (prefix ap-)
```

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
in `barber-saas-infra`), and open `/appointments`.

### Where the data is

Nowhere in this app: the appointments live in the `appointment` schema (`appointment-api`), the
services and barbers in `barbershop`, the free slots are computed by `schedule-api`, and the
session is the shell's.

### How it is tested

`npm test` (Vitest): the calls to the APIs, the day chips, the actions per status, the booking
guard, the labels and business messages, the routes and the error messages. CI also checks the
types and builds the remote.

### What is missing

- **Clients and OQ-07.** A client's token carries no barbershop, so the booking screen explains
  that the account is not bound to the barbershop until OQ-07 is decided.
- **Barber names (OQ-08).** Barbers are told apart by their experience until the profile carries a name.
- Not in the contract yet: rescheduling, reviews of a completed appointment, and the reward coupon
  applied at booking that the prototype had.
